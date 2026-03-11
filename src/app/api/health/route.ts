import { NextRequest, NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "../../../lib/mongodb";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";

export async function GET(req: NextRequest) {
  const rate = checkRateLimit(req, "api-health", 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const client = await getMongoClient();
    const dbName = getMongoDbName();
    await client.db(dbName).command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      status: "healthy",
      db: dbName,
      timestamp: new Date().toISOString(),
    }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: NO_CACHE_HEADERS }
    );
  }
}
