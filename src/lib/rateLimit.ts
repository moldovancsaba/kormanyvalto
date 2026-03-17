import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  backend: "redis" | "memory";
};

const globalWithRateLimit = global as typeof globalThis & {
  _rateBuckets?: Map<string, Bucket>;
  _upstashRedis?: Redis | null;
};

const MAX_BUCKETS = 20_000;

function getBuckets() {
  if (!globalWithRateLimit._rateBuckets) {
    globalWithRateLimit._rateBuckets = new Map<string, Bucket>();
  }
  return globalWithRateLimit._rateBuckets;
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

function getClientSubnet(ip: string) {
  if (ip.includes(":")) {
    const segments = ip.split(":").slice(0, 4);
    return segments.join(":");
  }

  const octets = ip.split(".");
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.${octets[2]}`;
  }

  return ip;
}

function getClientFingerprint(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "unknown";
  const language = req.headers.get("accept-language") || "unknown";
  return createHash("sha256").update(`${ip}|${ua.slice(0, 160)}|${language.slice(0, 160)}`).digest("hex");
}

function normalizeRateKeyPart(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getRedisClient() {
  if (globalWithRateLimit._upstashRedis !== undefined) {
    return globalWithRateLimit._upstashRedis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    globalWithRateLimit._upstashRedis = null;
    return null;
  }

  globalWithRateLimit._upstashRedis = new Redis({ url, token });
  return globalWithRateLimit._upstashRedis;
}

function buildRateKeys(req: NextRequest, routeKey: string, extraKeys: string[] = []) {
  const ip = getClientIp(req);
  const keys = [
    `${routeKey}:fingerprint:${getClientFingerprint(req)}`,
    `${routeKey}:ip:${normalizeRateKeyPart(ip)}`,
    `${routeKey}:subnet:${normalizeRateKeyPart(getClientSubnet(ip))}`,
  ];

  for (const extraKey of extraKeys) {
    keys.push(`${routeKey}:extra:${normalizeRateKeyPart(extraKey)}`);
  }

  return keys;
}

function evaluateBucket(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const buckets = getBuckets();

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    if (buckets.size > MAX_BUCKETS) {
      buckets.clear();
    }
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000), backend: "memory" };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      backend: "memory",
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    backend: "memory",
  };
}

function checkMemoryRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number, extraKeys: string[] = []): RateLimitResult {
  const results = buildRateKeys(req, routeKey, extraKeys).map((key) => evaluateBucket(key, limit, windowMs));
  return results.reduce((worst, current) => {
    if (!current.allowed) return current;
    if (!worst.allowed) return worst;
    return current.remaining < worst.remaining ? current : worst;
  });
}

async function checkRedisRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number, extraKeys: string[] = []): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const results: RateLimitResult[] = [];

    for (const rawKey of buildRateKeys(req, routeKey, extraKeys)) {
      const key = `ratelimit:${rawKey}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }

      const ttl = await redis.ttl(key);
      const retryAfterSec = ttl > 0 ? ttl : windowSec;

      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSec,
          backend: "redis",
        };
      }

      results.push({
        allowed: true,
        remaining: Math.max(0, limit - count),
        retryAfterSec,
        backend: "redis",
      });
    }

    return results.reduce((worst, current) => (current.remaining < worst.remaining ? current : worst));
  } catch {
    return null;
  }
}

export async function checkRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number, extraKeys: string[] = []) {
  const redisResult = await checkRedisRateLimit(req, routeKey, limit, windowMs, extraKeys);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(req, routeKey, limit, windowMs, extraKeys);
}
