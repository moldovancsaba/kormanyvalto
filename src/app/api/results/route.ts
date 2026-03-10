import { NextResponse } from "next/server";
import { getResults } from "../../../lib/results";

export async function GET() {
  const data = await getResults();
  return NextResponse.json(data);
}
