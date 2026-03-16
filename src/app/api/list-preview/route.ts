import { NextRequest, NextResponse } from "next/server";
import { NO_CACHE_HEADERS } from "../../../lib/http";
import { getMatrixStatus } from "../../../lib/matrixStatus";
import { formatPercent } from "../../../lib/numberFormat";
import { checkRateLimit } from "../../../lib/rateLimit";
import { getParliamentEstimate } from "../../../lib/results";
import { getCooldownSec, getExistingVoteActor } from "../../../lib/voteEngine";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-list-preview", 90, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const estimate = await getParliamentEstimate("projection");
  const listTotal = estimate.listBasisYes + estimate.listBasisNo;
  const yesPercent = listTotal > 0 ? (estimate.listBasisYes / listTotal) * 100 : 50;
  const noPercent = listTotal > 0 ? (estimate.listBasisNo / listTotal) * 100 : 50;
  const marginVotes = Math.abs(estimate.listBasisYes - estimate.listBasisNo);
  const marginPercent = listTotal > 0 ? (marginVotes / listTotal) * 100 : 0;
  const matrixStatus = getMatrixStatus(
    estimate.listBasisYes,
    estimate.listBasisNo,
    estimate.totalYesSeats,
    estimate.totalNoSeats
  );

  const actor = await getExistingVoteActor(req);
  const cooldownSec = actor ? await getCooldownSec(actor.actorId, "main") : 0;

  return NextResponse.json(
    {
      listBasisYes: estimate.listBasisYes,
      listBasisNo: estimate.listBasisNo,
      listYesSeats: estimate.listYesSeats,
      listNoSeats: estimate.listNoSeats,
      unresolvedListSeats: estimate.unresolvedListSeats,
      yesPercent,
      noPercent,
      marginVotes,
      marginPercent,
      matrixText: matrixStatus.text,
      listSummary: `Igen: ${estimate.listBasisYes} (${formatPercent(yesPercent)}) | nem: ${estimate.listBasisNo} (${formatPercent(noPercent)})`,
      cooldownSec,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
