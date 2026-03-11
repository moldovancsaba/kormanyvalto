import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const globalWithRateLimit = global as typeof globalThis & {
  _rateBuckets?: Map<string, Bucket>;
};

function getBuckets() {
  if (!globalWithRateLimit._rateBuckets) {
    globalWithRateLimit._rateBuckets = new Map<string, Bucket>();
  }
  return globalWithRateLimit._rateBuckets;
}

function clientKey(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `${ip}:${ua.slice(0, 80)}`;
}

export function checkRateLimit(req: NextRequest, routeKey: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${routeKey}:${clientKey(req)}`;
  const buckets = getBuckets();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
