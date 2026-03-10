import { NextResponse } from "next/server";
import { getMongoClient } from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await getMongoClient();
    await client.db().command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
