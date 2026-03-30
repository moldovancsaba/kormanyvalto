import { NextRequest, NextResponse } from "next/server";
import { readAppSessionFromRequest } from "../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getNickname, setNickname } from "../../../lib/vip";

export async function GET(req: NextRequest) {
  const session = await readAppSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const nickname = await getNickname(session.sub);
  return NextResponse.json({ nickname }, { headers: NO_CACHE_HEADERS });
}

export async function POST(req: NextRequest) {
  const session = await readAppSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const rate = await checkRateLimit(req, "api-nickname", 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const raw = typeof body?.nickname === "string" ? body.nickname : "";

  const cleaned = raw.trim().replace(/[<>&"']/g, "").slice(0, 24);
  if (cleaned.length < 2) {
    return NextResponse.json({ error: "A becenév legalább 2 karakter legyen" }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  await setNickname(session.sub, cleaned);
  return NextResponse.json({ nickname: cleaned }, { headers: NO_CACHE_HEADERS });
}
