import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { getMongoClient, getMongoDbName } from "./mongodb";

type ReputationSubjectType = "actor" | "ip" | "subnet" | "fingerprint";

type ReputationDoc = {
  _id: string;
  subjectType: ReputationSubjectType;
  score: number;
  signals: number;
  lastSeenAt: Date;
  updatedAt: Date;
  createdAt: Date;
};

export type ReputationSnapshot = {
  actor: number;
  ip: number;
  subnet: number;
  fingerprint: number;
  aggregate: number;
};

const DECAY_PER_DAY = 0.85;

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) return firstIp.trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

function getClientSubnet(ip: string) {
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":");
  }
  const octets = ip.split(".");
  return octets.length === 4 ? `${octets[0]}.${octets[1]}.${octets[2]}` : ip;
}

function getFingerprint(req: NextRequest) {
  return hashValue(
    [
      req.headers.get("user-agent") || "unknown",
      req.headers.get("accept-language") || "unknown",
      req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "unknown",
    ].join("|")
  );
}

function makeId(type: ReputationSubjectType, value: string) {
  return `${type}:${hashValue(value)}`;
}

async function getCollection() {
  const client = await getMongoClient();
  return client.db(getMongoDbName()).collection<ReputationDoc>("abuse_reputation");
}

function applyDecay(score: number, updatedAt: Date, now: Date) {
  const diffDays = Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  return score * Math.pow(DECAY_PER_DAY, diffDays);
}

export async function readReputationSnapshot(req: NextRequest, actorId: string): Promise<ReputationSnapshot> {
  const now = new Date();
  const ip = getClientIp(req);
  const subjects = {
    actor: makeId("actor", actorId),
    ip: makeId("ip", ip),
    subnet: makeId("subnet", getClientSubnet(ip)),
    fingerprint: makeId("fingerprint", getFingerprint(req)),
  };

  const docs = await (await getCollection()).find({ _id: { $in: Object.values(subjects) } }).toArray();
  const getScore = (id: string) => {
    const doc = docs.find((item) => item._id === id);
    return doc ? applyDecay(doc.score, doc.updatedAt, now) : 0;
  };

  const snapshot = {
    actor: getScore(subjects.actor),
    ip: getScore(subjects.ip),
    subnet: getScore(subjects.subnet),
    fingerprint: getScore(subjects.fingerprint),
    aggregate: 0,
  };
  snapshot.aggregate = snapshot.actor + snapshot.ip + snapshot.subnet + snapshot.fingerprint;
  return snapshot;
}

export async function updateReputation(req: NextRequest, actorId: string, delta: number) {
  const now = new Date();
  const ip = getClientIp(req);
  const subjects: Array<{ type: ReputationSubjectType; value: string; weight: number }> = [
    { type: "actor", value: actorId, weight: 1 },
    { type: "ip", value: ip, weight: 0.7 },
    { type: "subnet", value: getClientSubnet(ip), weight: 0.45 },
    { type: "fingerprint", value: getFingerprint(req), weight: 0.6 },
  ];

  const collection = await getCollection();
  await Promise.all(
    subjects.map(async ({ type, value, weight }) => {
      const _id = makeId(type, value);
      const existing = await collection.findOne({ _id });
      const currentScore = existing ? applyDecay(existing.score, existing.updatedAt, now) : 0;
      await collection.updateOne(
        { _id },
        {
          $set: {
            subjectType: type,
            score: Number((currentScore + delta * weight).toFixed(2)),
            lastSeenAt: now,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            signals: 0,
          },
          $inc: {
            signals: 1,
          },
        },
        { upsert: true }
      );
    })
  );
}
