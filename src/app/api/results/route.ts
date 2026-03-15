import { NextRequest, NextResponse } from "next/server";
import { getParliamentEstimate, getResults } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getCooldownSec, getExistingVoteActor } from "../../../lib/voteEngine";
import { normalizeScope } from "../../../lib/requestValidation";

function getMatrixStatus(
  yesVotes: number,
  noVotes: number,
  yesProjectedSeats: number,
  noProjectedSeats: number
): { code: "YY" | "YN" | "NY" | "NN" | "TT"; text: string } {
  const voteLead: "yes" | "no" | "tie" = yesVotes === noVotes ? "tie" : yesVotes > noVotes ? "yes" : "no";
  const projectedOutcome: "yes" | "no" | "tie" =
    yesProjectedSeats === noProjectedSeats ? "tie" : yesProjectedSeats > noProjectedSeats ? "yes" : "no";

  if (voteLead === "tie" || projectedOutcome === "tie") {
    return {
      code: "TT",
      text: "Fej fej mellett állás",
    };
  }

  if (voteLead === "yes" && projectedOutcome === "yes") {
    return {
      code: "YY",
      text: "Az igenek vannak többségben, és ha most lenne vége, kormányváltás lenne.",
    };
  }

  if (voteLead === "yes" && projectedOutcome === "no") {
    return {
      code: "YN",
      text: "Az igenek vannak többségben, de ha most lenne vége, nem lenne kormányváltás.",
    };
  }

  if (voteLead === "no" && projectedOutcome === "no") {
    return {
      code: "NN",
      text: "A nemek vannak többségben, és ha most lenne vége, nem lenne kormányváltás.",
    };
  }

  return {
    code: "NY",
    text: "A nemek vannak többségben, de ha most lenne vége, kormányváltás lenne.",
  };
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
