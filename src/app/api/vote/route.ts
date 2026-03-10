import { NextRequest, NextResponse } from "next/server";
import { addVote, type VoteType } from "../../../lib/results";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = body?.type as VoteType | undefined;

  if (type !== "yes" && type !== "no") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }

  const data = await addVote(type);
  return NextResponse.json(data);
}
