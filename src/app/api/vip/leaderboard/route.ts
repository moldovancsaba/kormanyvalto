import { NextResponse } from "next/server";
import { NO_CACHE_HEADERS } from "../../../../lib/http";
import { getVipLeaderboardUsers, getVipLeaderboardDistricts } from "../../../../lib/vip";

export async function GET() {
  const [users, districts] = await Promise.all([
    getVipLeaderboardUsers(20),
    getVipLeaderboardDistricts(20),
  ]);

  return NextResponse.json({ users, districts }, { headers: NO_CACHE_HEADERS });
}
