import { NextRequest, NextResponse } from "next/server";
import { isSsoConfigured, readAppSessionFromRequest } from "../../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../../lib/http";
import { checkRateLimit } from "../../../../lib/rateLimit";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-auth-session", 90, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const session = await readAppSessionFromRequest(req);

  return NextResponse.json(
    {
      configured: isSsoConfigured(),
      authenticated: Boolean(session),
      user: session
        ? {
            email: session.email,
            name: session.name,
            picture: session.picture || null,
            provider: session.provider,
            multiplier: 3,
          }
        : null,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
