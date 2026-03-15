import { NextRequest, NextResponse } from "next/server";
import { getCityStatsByBloc } from "../../../lib/results";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bloc = searchParams.get("bloc");
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "10");

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

