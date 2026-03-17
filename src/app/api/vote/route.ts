import { NextRequest, NextResponse } from "next/server";
import { assessVoteAbuse, detectVoteAnomaly, logAbuseAssessment, logVoteAnomaly, recordAbuseOutcome } from "../../../lib/abuseProtection";
import { addVote, type VoteType } from "../../../lib/results";
import { isTrustedOrigin, NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { ANON_VOTER_COOKIE, shouldUseSecureCookies } from "../../../lib/auth";
import { getVoteActor, reserveVoteSlot, withAdjustedCooldown } from "../../../lib/voteEngine";
import { normalizeScope } from "../../../lib/requestValidation";

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    if (!isTrustedOrigin(origin, referer, host)) {
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
    const initialAssessment = await assessVoteAbuse(req, actor, scope, [rate]);
    const abuseRate = await checkRateLimit(
      req,
      "api-vote-actor",
      initialAssessment.policy.actorWindowLimit,
      initialAssessment.policy.actorWindowMs,
      [`actor:${actor.actorId}`, `scope:${scope}`]
    );
    if (!abuseRate.allowed) {
      await recordAbuseOutcome(req, actor, initialAssessment, "rate_limited");
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(abuseRate.retryAfterSec) } }
      );
    }

    const assessment = await assessVoteAbuse(req, actor, scope, [rate, abuseRate]);
    await logAbuseAssessment(req, actor, scope, assessment);
    if (assessment.shouldRestrict) {
      await recordAbuseOutcome(req, actor, assessment, "restricted");
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { ...NO_CACHE_HEADERS, "Retry-After": String(Math.max(rate.retryAfterSec, abuseRate.retryAfterSec, 30)) },
        }
      );
    }

    const trustedActor = withAdjustedCooldown(actor, assessment.adjustedCooldownStep);
    let reserved = await reserveVoteSlot(trustedActor, scope);
    if (!reserved.allowed) {
      await recordAbuseOutcome(req, actor, assessment, "cooldown");
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
      weight: trustedActor.weight,
      mode: trustedActor.mode,
    });

    const anomaly = await detectVoteAnomaly(trustedActor, scope);
    if (anomaly) {
      await logVoteAnomaly(req, trustedActor, scope, assessment, anomaly);
    }
    await recordAbuseOutcome(req, trustedActor, assessment, "accepted");

    const response = NextResponse.json(
      {
        ...data,
        cooldownSec: reserved.cooldownSec,
        trustLevel: assessment.trustLevel,
      },
      {
        headers: {
          ...NO_CACHE_HEADERS,
          "X-Trust-Level": assessment.trustLevel,
          "X-Abuse-Score": String(assessment.score),
        },
      }
    );
    if (trustedActor.shouldSetAnonymousCookie && trustedActor.anonymousCookieToken) {
      response.cookies.set(ANON_VOTER_COOKIE, trustedActor.anonymousCookieToken, {
        httpOnly: true,
        sameSite: "strict",
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
