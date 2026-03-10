import { getMongoClient } from "./mongodb";

export type VoteType = "yes" | "no";

export type ClickStore = {
  yes: string[];
  no: string[];
};

type VoteDoc = {
  type: VoteType;
  timestamp: string;
};

async function getVotesCollection() {
  const client = await getMongoClient();
  const db = client.db();
  return db.collection<VoteDoc>("votes");
}

export async function getResults(): Promise<ClickStore> {
  const votes = await (await getVotesCollection())
    .find({}, { projection: { _id: 0, type: 1, timestamp: 1 } })
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

export async function addVote(type: VoteType): Promise<ClickStore> {
  await (await getVotesCollection()).insertOne({
    type,
    timestamp: new Date().toISOString(),
  });

  return getResults();
}
