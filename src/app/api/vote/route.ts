import { NextRequest, NextResponse } from "next/server";
import { assessVoteAbuse, detectVoteAnomaly, logAbuseAssessment, logVoteAnomaly, recordAbuseOutcome } from "../../../lib/abuseProtection";
import { addVote, type VoteType } from "../../../lib/results";
import { isTrustedOrigin, NO_CACHE_HEADERS } from "../../../lib/http";
import { checkRateLimit } from "../../../lib/rateLimit";
import { ANON_VOTER_COOKIE, readAppSessionFromRequest, shouldUseSecureCookies } from "../../../lib/auth";
import { getCooldownSec, getNextCooldownSec, getVoteActor, reserveVoteSlot, withAdjustedCooldown } from "../../../lib/voteEngine";
import { normalizeScope } from "../../../lib/requestValidation";
import { getRandomVipWeight, getRandomVipCooldown, getNickname, addVipVote } from "../../../lib/vip";

export async function HEAD(req: NextRequest) {
  try {
    const scope = normalizeScope(new URL(req.url).searchParams.get("scope")) || "main";
    const actor = await getVoteActor(req);
    const cooldownSec = await getCooldownSec(actor.actorId, scope);
    const nextCooldownSec = await getNextCooldownSec(actor.actorId, scope, actor.cooldownStep);

    return new NextResponse(null, {
      status: 204,
      headers: {
        ...NO_CACHE_HEADERS,
        "X-Warmup": "vote",
        "X-Cooldown-Sec": String(cooldownSec),
        "X-Next-Cooldown-Sec": String(nextCooldownSec),
      },
    });
  } catch {
    return new NextResponse(null, { status: 204, headers: NO_CACHE_HEADERS });
  }
}

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
    const isVip = body?.vip === true;

    if (type !== "yes" && type !== "no") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!scope) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (isVip) {
      const session = await readAppSessionFromRequest(req);
      if (!session) {
        return NextResponse.json({ error: "VIP szavazáshoz Google belépés szükséges" }, { status: 401, headers: NO_CACHE_HEADERS });
      }

      const weight = getRandomVipWeight();
      const cooldownSec = getRandomVipCooldown();
      const nickname = await getNickname(session.sub);

      await addVipVote({
        userId: session.sub,
        nickname: nickname ?? undefined,
        scope,
        type,
        weight,
      });

      await addVote({
        type,
        scope,
        weight,
        mode: "vip",
      });

      return NextResponse.json(
        {
          yesCount: 0,
          noCount: 0,
          history: [],
          cooldownSec,
          vipWeight: weight,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const actor = await getVoteActor(req);
    const getFallbackAssessment = () => ({
      score: 0,
      trustLevel: "standard" as const,
      reasons: ["abuse_assessment_fallback"],
      adjustedCooldownStep: actor.cooldownStep,
      shouldLogAnomaly: false,
      shouldRestrict: false,
      policy: {
        trustLevel: "standard" as const,
        cooldownMultiplier: 1,
        actorWindowLimit: 12,
        actorWindowMs: 60_000,
        deny: false,
        responseCode: 200 as const,
      },
      reputation: {
        actor: 0,
        ip: 0,
        subnet: 0,
        fingerprint: 0,
        aggregate: 0,
      },
    });

    const initialAssessment = await assessVoteAbuse(req, actor, scope, [rate]).catch(() => getFallbackAssessment());
    const abuseRate = await checkRateLimit(
      req,
      "api-vote-actor",
      initialAssessment.policy.actorWindowLimit,
      initialAssessment.policy.actorWindowMs,
      [`actor:${actor.actorId}`, `scope:${scope}`]
    );
    if (!abuseRate.allowed) {
      await recordAbuseOutcome(req, actor, initialAssessment, "rate_limited").catch(() => undefined);
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(abuseRate.retryAfterSec) } }
      );
    }

    const assessment = await assessVoteAbuse(req, actor, scope, [rate, abuseRate]).catch(() => getFallbackAssessment());
    await logAbuseAssessment(req, actor, scope, assessment).catch(() => undefined);
    if (assessment.shouldRestrict) {
      await recordAbuseOutcome(req, actor, assessment, "restricted").catch(() => undefined);
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
      await recordAbuseOutcome(req, actor, assessment, "cooldown").catch(() => undefined);
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

    const anomaly = await detectVoteAnomaly(trustedActor, scope).catch(() => null);
    if (anomaly) {
      await logVoteAnomaly(req, trustedActor, scope, assessment, anomaly).catch(() => undefined);
    }
    await recordAbuseOutcome(req, trustedActor, assessment, "accepted").catch(() => undefined);

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
  } catch (error) {
    console.error("Vote handling failed", error);
    return NextResponse.json({ error: "Vote handling failed." }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
