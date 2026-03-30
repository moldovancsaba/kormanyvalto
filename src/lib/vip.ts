import { randomInt } from "crypto";
import { Collection } from "mongodb";
import { getMongoClient, getMongoDbName } from "./mongodb";

export const VIP_MIN_WEIGHT = 1;
export const VIP_MAX_WEIGHT = 7;
export const VIP_MIN_COOLDOWN = 1;
export const VIP_MAX_COOLDOWN = 7;

export function getRandomVipWeight(): number {
  return randomInt(VIP_MIN_WEIGHT, VIP_MAX_WEIGHT + 1);
}

export function getRandomVipCooldown(): number {
  return randomInt(VIP_MIN_COOLDOWN, VIP_MAX_COOLDOWN + 1);
}

export type NicknameDoc = {
  _id: string;
  userId: string;
  nickname: string;
  updatedAt: Date;
};

export type LeaderboardUserEntry = {
  nickname: string;
  totalVotes: number;
  totalWeight: number;
};

export type LeaderboardDistrictEntry = {
  scope: string;
  label: string;
  county: string;
  city: string;
  totalVotes: number;
  totalWeight: number;
};

async function getNicknamesCollection(): Promise<Collection<NicknameDoc>> {
  const client = await getMongoClient();
  return client.db(getMongoDbName()).collection<NicknameDoc>("nicknames");
}

async function getVipVotesCollection() {
  const client = await getMongoClient();
  return client.db(getMongoDbName()).collection<{
    userId: string;
    nickname?: string;
    scope: string;
    type: string;
    weight: number;
    mode: string;
    timestamp: string;
  }>("vip_votes");
}

export async function getNickname(userId: string): Promise<string | null> {
  const collection = await getNicknamesCollection();
  const doc = await collection.findOne({ _id: userId });
  return doc?.nickname ?? null;
}

export async function setNickname(userId: string, nickname: string): Promise<void> {
  const collection = await getNicknamesCollection();
  await collection.updateOne(
    { _id: userId },
    {
      $set: {
        userId,
        nickname,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function addVipVote({
  userId,
  nickname,
  scope,
  type,
  weight,
}: {
  userId: string;
  nickname?: string;
  scope: string;
  type: string;
  weight: number;
}) {
  const collection = await getVipVotesCollection();
  await collection.insertOne({
    userId,
    nickname,
    scope,
    type,
    weight,
    mode: "vip",
    timestamp: new Date().toISOString(),
  });
}

export async function getVipLeaderboardUsers(limit = 20): Promise<LeaderboardUserEntry[]> {
  const collection = await getVipVotesCollection();
  const rows = await collection
    .aggregate<{ _id: string; totalVotes: number; totalWeight: number }>([
      { $match: { nickname: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$userId",
          nickname: { $last: "$nickname" },
          totalVotes: { $sum: 1 },
          totalWeight: { $sum: "$weight" },
        },
      },
      { $sort: { totalWeight: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return rows.map((row) => ({
    nickname: (row as unknown as { nickname: string }).nickname || row._id,
    totalVotes: row.totalVotes,
    totalWeight: row.totalWeight,
  }));
}

export async function getVipLeaderboardDistricts(limit = 20): Promise<LeaderboardDistrictEntry[]> {
  const collection = await getVipVotesCollection();
  const rows = await collection
    .aggregate<{ _id: string; totalVotes: number; totalWeight: number }>([
      { $match: { scope: { $regex: /^ogy2026\/egyeni-valasztokeruletek\/\d{2}\/\d{2}$/ } } },
      {
        $group: {
          _id: "$scope",
          totalVotes: { $sum: 1 },
          totalWeight: { $sum: "$weight" },
        },
      },
      { $sort: { totalWeight: -1 } },
      { $limit: limit },
    ])
    .toArray();

  const { findConstituency, getSeatLabel } = await import("./constituencies");

  return rows.map((row) => {
    const match = row._id.match(/^ogy2026\/egyeni-valasztokeruletek\/(\d{2})\/(\d{2})$/);
    const [, maz, evk] = match || [];
    const constituency = maz && evk ? findConstituency(maz, evk) : null;
    return {
      scope: row._id,
      label: constituency ? `${constituency.evkNev} - ${getSeatLabel(constituency.szekhely)}` : row._id,
      county: constituency?.mazNev ?? "",
      city: constituency ? getSeatLabel(constituency.szekhely) : "",
      totalVotes: row.totalVotes,
      totalWeight: row.totalWeight,
    };
  });
}
