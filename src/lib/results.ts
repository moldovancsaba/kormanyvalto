import { getMongoClient, getMongoDbName } from "./mongodb";

export type VoteType = "yes" | "no";

export type ClickStore = {
  yes: string[];
  no: string[];
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

export async function getResults(scope = "main"): Promise<ClickStore> {
  const filter =
    scope === "main"
      ? { $or: [{ scope: "main" }, { scope: { $exists: false } }] }
      : { scope };

  const votes = await (await getVotesCollection())
    .find(filter, { projection: { _id: 0, type: 1, timestamp: 1 } })
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

  return { yes, no };
}

export async function addVote(type: VoteType, scope = "main"): Promise<ClickStore> {
  await (await getVotesCollection()).insertOne({
    scope,
    type,
    timestamp: new Date().toISOString(),
  });

  return getResults(scope);
}
