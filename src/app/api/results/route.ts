import { NextRequest, NextResponse } from "next/server";
import { getResults } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCooldownSec, getExistingVoteActor } from "../../../lib/voteEngine";

function normalizeScope(raw: string | null) {
  const scope = raw?.trim() || "main";
  return scope.slice(0, 120);
}

export async function GET(req: NextRequest) {
  const rate = checkRateLimit(req, "api-results", 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const url = new URL(req.url);
  const scope = normalizeScope(url.searchParams.get("scope"));
  const aggregate = url.searchParams.get("aggregate") === "1";
  const data = await getResults(scope, aggregate);
  const actor = await getExistingVoteActor(req);
  const cooldownSec = actor ? await getCooldownSec(actor.actorId, scope) : 0;
  return NextResponse.json({ ...data, cooldownSec }, { headers: NO_CACHE_HEADERS });
}
