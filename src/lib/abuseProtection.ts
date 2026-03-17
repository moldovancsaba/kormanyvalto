import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { getMongoClient, getMongoDbName } from "./mongodb";
import { RateLimitResult } from "./rateLimit";
import { readReputationSnapshot, ReputationSnapshot, updateReputation } from "./reputation";
import { VoteActor } from "./voteEngine";

export type TrustLevel = "trusted" | "standard" | "suspicious" | "restricted";

export type AbuseAssessment = {
  score: number;
  trustLevel: TrustLevel;
  reasons: string[];
  adjustedCooldownStep: number;
  shouldLogAnomaly: boolean;
  shouldRestrict: boolean;
  policy: TrustPolicy;
  reputation: ReputationSnapshot;
};

export type TrustPolicy = {
  trustLevel: TrustLevel;
  cooldownMultiplier: number;
  actorWindowLimit: number;
  actorWindowMs: number;
  deny: boolean;
  responseCode: 200 | 429;
};

type AbuseEventDoc = {
  kind: "abuse-score" | "vote-anomaly";
  actorId: string;
  scope: string;
  trustLevel: TrustLevel;
  score: number;
  reasons: string[];
  mode: VoteActor["mode"];
  edge: {
    botScore: number | null;
    country: string | null;
    proxy: string | null;
  };
  fingerprint: string;
  createdAt: Date;
};

type VoteAnomalySnapshot = {
  scopeVoteCount: number;
  actorScopeVoteCount: number;
  recentWindowMs: number;
};

function parseNumericHeader(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getEdgeSignals(req: NextRequest) {
  return {
    botScore:
      parseNumericHeader(req.headers.get("x-verified-bot-score")) ??
      parseNumericHeader(req.headers.get("x-bot-score")) ??
      parseNumericHeader(req.headers.get("cf-bot-score")),
    country: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"),
    proxy: req.headers.get("x-forwarded-for") || null,
  };
}

function getRequestFingerprint(req: NextRequest) {
  const parts = [
    req.headers.get("x-forwarded-for") || "unknown",
    req.headers.get("user-agent") || "unknown",
    req.headers.get("accept-language") || "unknown",
    req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "unknown",
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function buildTrustPolicy(trustLevel: TrustLevel): TrustPolicy {
  switch (trustLevel) {
    case "trusted":
      return { trustLevel, cooldownMultiplier: 0.9, actorWindowLimit: 18, actorWindowMs: 60_000, deny: false, responseCode: 200 };
    case "suspicious":
      return { trustLevel, cooldownMultiplier: 2.5, actorWindowLimit: 8, actorWindowMs: 60_000, deny: false, responseCode: 200 };
    case "restricted":
      return { trustLevel, cooldownMultiplier: 5, actorWindowLimit: 4, actorWindowMs: 60_000, deny: true, responseCode: 429 };
    case "standard":
    default:
      return { trustLevel: "standard", cooldownMultiplier: 1, actorWindowLimit: 12, actorWindowMs: 60_000, deny: false, responseCode: 200 };
  }
}

export async function assessVoteAbuse(req: NextRequest, actor: VoteActor, scope: string, rateSignals: RateLimitResult[]): Promise<AbuseAssessment> {
  const reasons: string[] = [];
  let score = 0;
  const edge = getEdgeSignals(req);
  const reputation = await readReputationSnapshot(req, actor.actorId);

  if (actor.mode === "anonymous") {
    score += 8;
  } else {
    score -= 6;
  }

  for (const signal of rateSignals) {
    if (signal.remaining <= 2) {
      score += 15;
      reasons.push(`rate_pressure:${signal.backend}`);
    } else if (signal.remaining <= 5) {
      score += 8;
      reasons.push(`rate_warming:${signal.backend}`);
    }
  }

  if (edge.botScore !== null) {
    if (edge.botScore < 10) {
      score += 45;
      reasons.push("edge_bot_score_critical");
    } else if (edge.botScore < 30) {
      score += 25;
      reasons.push("edge_bot_score_low");
    } else if (edge.botScore > 70) {
      score -= 5;
    }
  }

  if (edge.proxy && edge.proxy.includes(",")) {
    score += 10;
    reasons.push("multi_hop_proxy");
  }

  if (scope !== "main") {
    score += 2;
  }

  if (reputation.aggregate >= 80) {
    score += 40;
    reasons.push("reputation_critical");
  } else if (reputation.aggregate >= 40) {
    score += 20;
    reasons.push("reputation_elevated");
  } else if (reputation.aggregate <= -20 && actor.mode === "google") {
    score -= 8;
    reasons.push("reputation_good");
  }

  let trustLevel: TrustLevel = "standard";

  if (score >= 60) {
    trustLevel = "restricted";
  } else if (score >= 35) {
    trustLevel = "suspicious";
  } else if (score <= 0 && actor.mode === "google") {
    trustLevel = "trusted";
  }

  const policy = buildTrustPolicy(trustLevel);
  const adjustedCooldownStep = Math.max(0.1, actor.cooldownStep * policy.cooldownMultiplier);

  return {
    score,
    trustLevel,
    reasons,
    adjustedCooldownStep,
    shouldLogAnomaly: trustLevel === "suspicious" || trustLevel === "restricted",
    shouldRestrict: policy.deny,
    policy,
    reputation,
  };
}

async function getAbuseEventsCollection() {
  const client = await getMongoClient();
  return client.db(getMongoDbName()).collection<AbuseEventDoc>("abuse_events");
}

export async function logAbuseAssessment(req: NextRequest, actor: VoteActor, scope: string, assessment: AbuseAssessment) {
  if (!assessment.shouldLogAnomaly) {
    return;
  }

  const edge = getEdgeSignals(req);
  await (await getAbuseEventsCollection()).insertOne({
    kind: "abuse-score",
    actorId: actor.actorId,
    scope,
    trustLevel: assessment.trustLevel,
    score: assessment.score,
    reasons: assessment.reasons,
    mode: actor.mode,
    edge,
    fingerprint: getRequestFingerprint(req),
    createdAt: new Date(),
  });
}

export async function recordAbuseOutcome(req: NextRequest, actor: VoteActor, assessment: AbuseAssessment, outcome: "accepted" | "restricted" | "cooldown" | "rate_limited") {
  let delta = 0;
  switch (outcome) {
    case "accepted":
      delta = assessment.trustLevel === "trusted" ? -3 : assessment.trustLevel === "standard" ? -1 : 0;
      break;
    case "cooldown":
      delta = 2;
      break;
    case "rate_limited":
      delta = 6;
      break;
    case "restricted":
      delta = 15;
      break;
  }
  if (delta !== 0) {
    await updateReputation(req, actor.actorId, delta);
  }
}

export async function detectVoteAnomaly(actor: VoteActor, scope: string): Promise<VoteAnomalySnapshot | null> {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const votes = db.collection<{ scope?: string; timestamp: string; mode?: VoteActor["mode"] }>("votes");
  const recentWindowMs = 5 * 60 * 1000;
  const sinceIso = new Date(Date.now() - recentWindowMs).toISOString();

  const [scopeVoteCount, actorScopeVoteCount] = await Promise.all([
    votes.countDocuments({ scope, timestamp: { $gte: sinceIso } }),
    db.collection<{ scope: string; actorId: string; updatedAt: Date }>("vote_sessions").countDocuments({
      scope,
      actorId: actor.actorId,
      updatedAt: { $gte: new Date(Date.now() - recentWindowMs) },
    }),
  ]);

  if (scopeVoteCount < 80 && actorScopeVoteCount < 5) {
    return null;
  }

  return {
    scopeVoteCount,
    actorScopeVoteCount,
    recentWindowMs,
  };
}

export async function logVoteAnomaly(req: NextRequest, actor: VoteActor, scope: string, assessment: AbuseAssessment, snapshot: VoteAnomalySnapshot) {
  const edge = getEdgeSignals(req);
  await (await getAbuseEventsCollection()).insertOne({
    kind: "vote-anomaly",
    actorId: actor.actorId,
    scope,
    trustLevel: assessment.trustLevel,
    score: assessment.score,
    reasons: [
      ...assessment.reasons,
      `scope_votes_${snapshot.scopeVoteCount}`,
      `actor_scope_votes_${snapshot.actorScopeVoteCount}`,
      `window_ms_${snapshot.recentWindowMs}`,
    ],
    mode: actor.mode,
    edge,
    fingerprint: getRequestFingerprint(req),
    createdAt: new Date(),
  });
}
