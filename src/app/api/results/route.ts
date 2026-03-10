import { NextResponse } from "next/server";
import { getResults } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";

export async function GET() {
  const data = await getResults();
  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}
