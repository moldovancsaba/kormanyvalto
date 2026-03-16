import { NextRequest, NextResponse } from "next/server";
import { getCityStatsByBloc } from "../../../lib/results";
import { checkRateLimit } from "../../../lib/rateLimit";
import { normalizePagination } from "../../../lib/requestValidation";
import { NO_CACHE_HEADERS } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-city-cards", 90, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const bloc = searchParams.get("bloc");
  const offset = normalizePagination(searchParams.get("offset"), 0, 0, 10_000);
  const limit = normalizePagination(searchParams.get("limit"), 10, 1, 50);

  if (bloc !== "yes" && bloc !== "no") {
    return NextResponse.json({ error: "Érvénytelen bloc paraméter." }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    const data = await getCityStatsByBloc(bloc, offset, limit);
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Nem sikerült betölteni a városlistát." }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
