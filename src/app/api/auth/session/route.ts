import { NextRequest, NextResponse } from "next/server";
import { isSsoConfigured, readAppSessionFromRequest } from "../../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../../lib/http";

export async function GET(req: NextRequest) {
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
