import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
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

function getClientFingerprint(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "unknown";
  const language = req.headers.get("accept-language") || "unknown";
  return createHash("sha256").update(`${ip}|${ua.slice(0, 160)}|${language.slice(0, 160)}`).digest("hex");
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

function buildRateKey(req: NextRequest, routeKey: string) {
  return `${routeKey}:${getClientFingerprint(req)}`;
}

function checkMemoryRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const key = buildRateKey(req, routeKey);
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

async function checkRedisRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const key = `ratelimit:${buildRateKey(req, routeKey)}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
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

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfterSec,
      backend: "redis",
    };
  } catch {
    return null;
  }
}

export async function checkRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number) {
  const redisResult = await checkRedisRateLimit(req, routeKey, limit, windowMs);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(req, routeKey, limit, windowMs);
}
