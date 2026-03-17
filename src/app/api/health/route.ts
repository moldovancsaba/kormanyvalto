import { NextRequest, NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "../../../lib/mongodb";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-health", 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const client = await getMongoClient();
    const dbName = getMongoDbName();
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    const abuseSince = new Date(Date.now() - 15 * 60 * 1000);
    const recentAbuseEvents = await db.collection("abuse_events").countDocuments({ createdAt: { $gte: abuseSince } });

    return NextResponse.json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      telemetry: {
        recentAbuseEvents,
        abuseWindowMinutes: 15,
      },
    }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: NO_CACHE_HEADERS }
    );
  }
}
