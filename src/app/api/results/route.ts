import { NextRequest, NextResponse } from "next/server";
import { getMatrixStatus } from "../../../lib/matrixStatus";
import { getParliamentEstimate, getResults } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCooldownSec, getExistingVoteActor } from "../../../lib/voteEngine";
import { normalizeScope } from "../../../lib/requestValidation";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-results", 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const url = new URL(req.url);
  const scope = normalizeScope(url.searchParams.get("scope"));
  const aggregate = url.searchParams.get("aggregate") === "1";
  if (!scope) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400, headers: NO_CACHE_HEADERS });
  }
  const data = await getResults(scope, aggregate);
  let matrixStatus: { code: "YY" | "YN" | "NY" | "NN" | "TT"; text: string } | undefined;

  if (scope === "main" && aggregate) {
    const estimate = await getParliamentEstimate("projection");
    matrixStatus = getMatrixStatus(data.yesCount, data.noCount, estimate.totalYesSeats, estimate.totalNoSeats);
  }

  const actor = await getExistingVoteActor(req);
  const cooldownSec = actor ? await getCooldownSec(actor.actorId, scope) : 0;
  return NextResponse.json({ ...data, cooldownSec, matrixStatus }, { headers: NO_CACHE_HEADERS });
}
