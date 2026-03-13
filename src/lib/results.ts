import { getMongoClient, getMongoDbName } from "./mongodb";
import { constituencies, findConstituency } from "./constituencies";
import { VoteMode } from "./voteEngine";

export type VoteType = "yes" | "no";

export type VoteHistoryItem = {
  type: VoteType;
  timestamp: string;
  scope: string;
  sourceLabel: string;
  weight: number;
  mode: VoteMode;
};

export type ResultsResponse = {
  yesCount: number;
  noCount: number;
  history: VoteHistoryItem[];
  cooldownSec?: number;
};

export type ScopeVoteCount = {
  yes: number;
  no: number;
  total: number;
  yesPercent: number;
};

export type CityVoteStat = {
  city: string;
  county: string;
  href: string;
  yes: number;
  no: number;
  total: number;
  diff: number;
};

export type DashboardSummary = {
  totalWeightedVotes: number;
  totalVoteEvents: number;
  totalRegisteredPlayers: number;
  weightedYes: number;
  weightedNo: number;
  weightedTripleVotes: number;
  weightedRegularVotes: number;
  tripleVoteEvents: number;
  regularVoteEvents: number;
};

type VoteDoc = {
  scope?: string;
  type: VoteType;
  timestamp: string;
  weight?: number;
  mode?: VoteMode;
};

async function getVotesCollection() {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  return db.collection<VoteDoc>("votes");
}

async function getVoteSessionsCollection() {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  return db.collection<{ actorId?: string }>("vote_sessions");
}

function getVoteWeight(vote: VoteDoc) {
  return typeof vote.weight === "number" && vote.weight > 0 ? vote.weight : 1;
}

export async function getResults(
  scope = "main",
  includeAllScopesForMain = false
): Promise<ResultsResponse> {
  const filter =
    scope === "main" && includeAllScopesForMain
      ? {}
      : scope === "main"
        ? { $or: [{ scope: "main" }, { scope: { $exists: false } }] }
        : { scope };

  const votes = await (await getVotesCollection())
    .find(filter, { projection: { _id: 0, type: 1, timestamp: 1, scope: 1, weight: 1, mode: 1 } })
    .sort({ timestamp: -1 })
    .toArray();

  let yesCount = 0;
  let noCount = 0;

  for (const vote of votes) {
    const weight = getVoteWeight(vote);
    if (vote.type === "yes") {
      yesCount += weight;
    } else {
      noCount += weight;
    }
  }

  const history = votes.slice(0, 30).map((vote) => {
    const normalizedScope = vote.scope ?? "main";
    return {
      type: vote.type,
      timestamp: vote.timestamp,
      scope: normalizedScope,
      sourceLabel: getScopeLabel(normalizedScope),
      weight: getVoteWeight(vote),
      mode: (vote.mode === "google" ? "google" : "anonymous") as VoteMode,
    };
  });

  return { yesCount, noCount, history };
}

function getScopeLabel(scope: string) {
  if (scope === "main") {
    return "Országos";
  }

  const match = scope.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})\/(\d{2})$/);
  if (!match) {
    return "Országos";
  }

  const [, maz, evk] = match;
  const constituency = findConstituency(maz, evk);
  return constituency ? `${constituency.mazNev}, ${constituency.szekhely}` : "Országos";
}

export async function addVote({
  type,
  scope = "main",
  weight,
  mode,
}: {
  type: VoteType;
  scope?: string;
  weight: number;
  mode: VoteMode;
}): Promise<ResultsResponse> {
  await (await getVotesCollection()).insertOne({
    scope,
    type,
    weight,
    mode,
    timestamp: new Date().toISOString(),
  });

  return getResults(scope, false);
}

export async function getScopeVoteCounts(scopes: string[]): Promise<Record<string, ScopeVoteCount>> {
  if (scopes.length === 0) return {};

  const rows = await (await getVotesCollection())
    .aggregate<{ _id: { scope: string; type: VoteType }; count: number }>([
      { $match: { scope: { $in: scopes } } },
      {
        $group: {
          _id: { scope: "$scope", type: "$type" },
          count: { $sum: { $ifNull: ["$weight", 1] } },
        },
      },
    ])
    .toArray();

  const out: Record<string, ScopeVoteCount> = {};
  for (const scope of scopes) {
    out[scope] = { yes: 0, no: 0, total: 0, yesPercent: 50 };
  }

  for (const row of rows) {
    const scope = row._id.scope;
    if (!out[scope]) continue;
    if (row._id.type === "yes") out[scope].yes = row.count;
    if (row._id.type === "no") out[scope].no = row.count;
  }

  for (const scope of scopes) {
    const item = out[scope];
    item.total = item.yes + item.no;
    item.yesPercent = item.total === 0 ? 50 : (item.yes / item.total) * 100;
  }

  return out;
}

export async function getDashboardCityStats(): Promise<CityVoteStat[]> {
  const constituencyScopes = constituencies.map((c) => ({
    scope: `ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`,
    city: c.szekhely,
    county: c.mazNev,
    href: `/ogy2026/egyeni-valasztokeruletek/${c.maz}/${c.evk}`,
  }));

  const scopeMap = new Map(
    constituencyScopes.map((item) => [
      item.scope,
      {
        city: item.city,
        county: item.county,
        href: item.href,
      },
    ])
  );

  const rows = await (await getVotesCollection())
    .aggregate<{ _id: { scope: string; type: VoteType }; count: number }>([
      { $match: { scope: { $in: constituencyScopes.map((item) => item.scope) } } },
      {
        $group: {
          _id: { scope: "$scope", type: "$type" },
          count: { $sum: { $ifNull: ["$weight", 1] } },
        },
      },
    ])
    .toArray();

  const cityMap = new Map<string, CityVoteStat>();

  for (const row of rows) {
    const meta = scopeMap.get(row._id.scope);
    if (!meta) continue;

    const key = `${meta.county}::${meta.city}`;
    const existing = cityMap.get(key) || {
      city: meta.city,
      county: meta.county,
      href: meta.href,
      yes: 0,
      no: 0,
      total: 0,
      diff: 0,
    };

    if (row._id.type === "yes") {
      existing.yes += row.count;
    } else {
      existing.no += row.count;
    }

    existing.total = existing.yes + existing.no;
    existing.diff = existing.yes - existing.no;
    cityMap.set(key, existing);
  }

  return [...cityMap.values()].sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, "hu"));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const rows = await (await getVotesCollection())
    .aggregate<{
      _id: { mode: VoteMode; type: VoteType };
      totalWeight: number;
      voteEvents: number;
    }>([
      {
        $group: {
          _id: {
            mode: { $ifNull: ["$mode", "anonymous"] },
            type: "$type",
          },
          totalWeight: { $sum: { $ifNull: ["$weight", 1] } },
          voteEvents: { $sum: 1 },
        },
      },
    ])
    .toArray();

  let weightedYes = 0;
  let weightedNo = 0;
  let weightedTripleVotes = 0;
  let weightedRegularVotes = 0;
  let tripleVoteEvents = 0;
  let regularVoteEvents = 0;

  for (const row of rows) {
    if (row._id.type === "yes") {
      weightedYes += row.totalWeight;
    } else {
      weightedNo += row.totalWeight;
    }

    if (row._id.mode === "google") {
      weightedTripleVotes += row.totalWeight;
      tripleVoteEvents += row.voteEvents;
    } else {
      weightedRegularVotes += row.totalWeight;
      regularVoteEvents += row.voteEvents;
    }
  }

  const registeredActors = await (await getVoteSessionsCollection()).distinct("actorId", {
    actorId: { $regex: /^user:/ },
  });

  return {
    totalWeightedVotes: weightedYes + weightedNo,
    totalVoteEvents: tripleVoteEvents + regularVoteEvents,
    totalRegisteredPlayers: registeredActors.length,
    weightedYes,
    weightedNo,
    weightedTripleVotes,
    weightedRegularVotes,
    tripleVoteEvents,
    regularVoteEvents,
  };
}
