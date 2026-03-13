import { Collection } from "mongodb";
import { NextRequest } from "next/server";
import { getMongoClient, getMongoDbName } from "./mongodb";
import { AppSession, createAnonymousActorId, getExistingAnonymousActorId, readAppSessionFromRequest } from "./auth";

export type VoteMode = "anonymous" | "google";

export type VoteActor = {
  actorId: string;
  mode: VoteMode;
  weight: 1 | 3;
  cooldownStep: number;
  shouldSetAnonymousCookie: boolean;
  session: AppSession | null;
};

type VoteSessionDoc = {
  _id: string;
  actorId: string;
  scope: string;
  voteCount: number;
  cooldownUntil: Date;
  updatedAt: Date;
};

const globalWithVoteIndexes = global as typeof globalThis & {
  _voteSessionIndexesReady?: boolean;
};

async function getVoteSessionCollection(): Promise<Collection<VoteSessionDoc>> {
  const client = await getMongoClient();
  const collection = client.db(getMongoDbName()).collection<VoteSessionDoc>("vote_sessions");

  if (!globalWithVoteIndexes._voteSessionIndexesReady) {
    await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
    globalWithVoteIndexes._voteSessionIndexesReady = true;
  }

  return collection;
}

export async function getVoteActor(req: NextRequest): Promise<VoteActor> {
  const session = await readAppSessionFromRequest(req);
  if (session) {
    return {
      actorId: `user:${session.sub}`,
      mode: "google",
      weight: 3,
      cooldownStep: 0.2,
      shouldSetAnonymousCookie: false,
      session,
    };
  }

  const existingAnonId = getExistingAnonymousActorId(req);
  return {
    actorId: existingAnonId || createAnonymousActorId(),
    mode: "anonymous",
    weight: 1,
    cooldownStep: 0.3,
    shouldSetAnonymousCookie: !existingAnonId,
    session: null,
  };
}

export async function getExistingVoteActor(req: NextRequest): Promise<VoteActor | null> {
  const session = await readAppSessionFromRequest(req);
  if (session) {
    return {
      actorId: `user:${session.sub}`,
      mode: "google",
      weight: 3,
      cooldownStep: 0.2,
      shouldSetAnonymousCookie: false,
      session,
    };
  }

  const anonId = getExistingAnonymousActorId(req);
  if (!anonId) {
    return null;
  }

  return {
    actorId: anonId,
    mode: "anonymous",
    weight: 1,
    cooldownStep: 0.3,
    shouldSetAnonymousCookie: false,
    session: null,
  };
}

export async function getCooldownSec(actorId: string, scope: string) {
  const collection = await getVoteSessionCollection();
  const session = await collection.findOne({ _id: `${actorId}:${scope}` });
  if (!session) {
    return 0;
  }

  const remainingMs = session.cooldownUntil.getTime() - Date.now();
  return remainingMs > 0 ? Number((remainingMs / 1000).toFixed(1)) : 0;
}

export async function reserveVoteSlot(actor: VoteActor, scope: string) {
  const collection = await getVoteSessionCollection();
  const key = `${actor.actorId}:${scope}`;
  const existing = await collection.findOne({ _id: key });
  const now = Date.now();

  if (existing && existing.cooldownUntil.getTime() > now) {
    return {
      allowed: false,
      cooldownSec: Number(((existing.cooldownUntil.getTime() - now) / 1000).toFixed(1)),
      voteCount: existing.voteCount,
    };
  }

  const nextCount = (existing?.voteCount ?? 0) + 1;
  const cooldownSec = Number((1 + (nextCount - 1) * actor.cooldownStep).toFixed(1));
  const cooldownUntil = new Date(now + cooldownSec * 1000);

  await collection.updateOne(
    { _id: key },
    {
      $set: {
        actorId: actor.actorId,
        scope,
        cooldownUntil,
        updatedAt: new Date(now),
      },
      $setOnInsert: {
        voteCount: 0,
      },
      $inc: {
        voteCount: 1,
      },
    },
    { upsert: true }
  );

  return {
    allowed: true,
    cooldownSec,
    voteCount: nextCount,
  };
}
