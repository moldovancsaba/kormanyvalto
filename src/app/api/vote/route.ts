import { NextRequest, NextResponse } from "next/server";
import { addVote, type VoteType } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, "api-vote", 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const type = body?.type as VoteType | undefined;
  const scope = (body?.scope as string | undefined)?.trim().slice(0, 120) || "main";

  if (type !== "yes" && type !== "no") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  const data = await addVote(type, scope);
  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}
