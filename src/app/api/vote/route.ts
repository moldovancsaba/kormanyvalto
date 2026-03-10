import { NextRequest, NextResponse } from "next/server";
import { addVote, type VoteType } from "../../../lib/results";
import { NO_CACHE_HEADERS } from "../../../lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = body?.type as VoteType | undefined;
  const scope = (body?.scope as string | undefined)?.trim().slice(0, 120) || "main";

  if (type !== "yes" && type !== "no") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  const data = await addVote(type, scope);
  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}
