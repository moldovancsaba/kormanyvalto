import { getMongoClient, getMongoDbName } from "./mongodb";
import { findConstituency } from "./constituencies";

export type VoteType = "yes" | "no";

export type ClickStore = {
  yes: string[];
  no: string[];
};

export type VoteHistoryItem = {
  type: VoteType;
  timestamp: string;
  scope: string;
  sourceLabel: string;
};

export type ResultsResponse = ClickStore & {
  history: VoteHistoryItem[];
};

export type ScopeVoteCount = {
  yes: number;
  no: number;
  total: number;
  yesPercent: number;
};

type VoteDoc = {
  scope?: string;
  type: VoteType;
  timestamp: string;
};

async function getVotesCollection() {
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  return db.collection<VoteDoc>("votes");
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
    .find(filter, { projection: { _id: 0, type: 1, timestamp: 1, scope: 1 } })
    .sort({ timestamp: -1 })
    .toArray();

  const yes: string[] = [];
  const no: string[] = [];

  for (const vote of votes) {
    if (vote.type === "yes") {
      yes.push(vote.timestamp);
    } else {
      no.push(vote.timestamp);
    }
  }

  const history = votes.slice(0, 30).map((vote) => {
    const normalizedScope = vote.scope ?? "main";
    return {
      type: vote.type,
      timestamp: vote.timestamp,
      scope: normalizedScope,
      sourceLabel: getScopeLabel(normalizedScope),
    };
  });

  return { yes, no, history };
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
  return constituency?.mazNev ?? "Országos";
}

export async function addVote(type: VoteType, scope = "main"): Promise<ResultsResponse> {
  await (await getVotesCollection()).insertOne({
    scope,
    type,
    timestamp: new Date().toISOString(),
  });

  return getResults(scope, false);
}

export async function getScopeVoteCounts(scopes: string[]): Promise<Record<string, ScopeVoteCount>> {
  if (scopes.length === 0) return {};

  const rows = await (await getVotesCollection())
    .aggregate<{ _id: { scope: string; type: VoteType }; count: number }>([
      { $match: { scope: { $in: scopes } } },
      { $group: { _id: { scope: "$scope", type: "$type" }, count: { $sum: 1 } } },
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
