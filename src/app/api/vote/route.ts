import { NextRequest, NextResponse } from "next/server";
import { addVote, type VoteType } from "../../../lib/results";
import { isTrustedOrigin, NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { ANON_VOTER_COOKIE, shouldUseSecureCookies } from "../../../lib/auth";
import { getVoteActor, reserveVoteSlot } from "../../../lib/voteEngine";
import { normalizeScope } from "../../../lib/requestValidation";

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (!isTrustedOrigin(origin, host)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers: NO_CACHE_HEADERS });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415, headers: NO_CACHE_HEADERS });
    }

    const rate = await checkRateLimit(req, "api-vote", 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const type = body?.type as VoteType | undefined;
    const scope = normalizeScope(body?.scope);

    if (type !== "yes" && type !== "no") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!scope) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const actor = await getVoteActor(req);
    let reserved = await reserveVoteSlot(actor, scope);
    if (!reserved.allowed) {
      return NextResponse.json(
        { error: "Cooldown active", cooldownSec: reserved.cooldownSec },
        {
          status: 429,
          headers: { ...NO_CACHE_HEADERS, "Retry-After": String(Math.max(1, Math.ceil(reserved.cooldownSec))) },
        }
      );
    }

    const data = await addVote({
      type,
      scope,
      weight: actor.weight,
      mode: actor.mode,
    });

    const response = NextResponse.json({ ...data, cooldownSec: reserved.cooldownSec }, { headers: NO_CACHE_HEADERS });
    if (actor.shouldSetAnonymousCookie) {
      response.cookies.set(ANON_VOTER_COOKIE, actor.actorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookies(),
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Vote handling failed." }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
