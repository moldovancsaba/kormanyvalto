import { Collection } from "mongodb";
import { NextRequest } from "next/server";
import { getMongoClient, getMongoDbName } from "./mongodb";
import {
  AppSession,
  createAnonymousActorCookie,
  createAnonymousActorId,
  getAnonymousFingerprintActorId,
  getExistingAnonymousActorId,
  readAppSessionFromRequest,
} from "./auth";

export type VoteMode = "anonymous" | "google";

export type VoteActor = {
  actorId: string;
  mode: VoteMode;
  weight: 1 | 3;
  cooldownStep: number;
  shouldSetAnonymousCookie: boolean;
  anonymousCookieToken: string | null;
  session: AppSession | null;
};

type VoteSessionDoc = {
  _id: string;
  actorId: string;
  scope: string;
  voteCount: number;
  cooldownUntil: Date | string | number;
  updatedAt: Date;
};

const globalWithVoteIndexes = global as typeof globalThis & {
  _voteSessionIndexesReady?: boolean;
};

async function getVoteSessionCollection(): Promise<Collection<VoteSessionDoc>> {
  const client = await getMongoClient();
  const collection = client.db(getMongoDbName()).collection<VoteSessionDoc>("vote_sessions");

  if (!globalWithVoteIndexes._voteSessionIndexesReady) {
    try {
      await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("IndexOptionsConflict") && !message.includes("already exists")) {
        throw error;
      }
    }
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
      anonymousCookieToken: null,
      session,
    };
  }

  const existingAnonId = await getExistingAnonymousActorId(req);
  const fingerprintActorId = getAnonymousFingerprintActorId(req);
  const actorId = existingAnonId || fingerprintActorId || createAnonymousActorId();
  const anonymousCookieToken = existingAnonId ? null : await createAnonymousActorCookie(req, actorId);
  return {
    actorId,
    mode: "anonymous",
    weight: 1,
    cooldownStep: 1,
    shouldSetAnonymousCookie: !existingAnonId,
    anonymousCookieToken,
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
      anonymousCookieToken: null,
      session,
    };
  }

  const anonId = await getExistingAnonymousActorId(req);
  const actorId = anonId || getAnonymousFingerprintActorId(req);
  if (!actorId) {
    return null;
  }

  return {
    actorId,
    mode: "anonymous",
    weight: 1,
    cooldownStep: 1,
    shouldSetAnonymousCookie: false,
    anonymousCookieToken: null,
    session: null,
  };
}

export async function getCooldownSec(actorId: string, scope: string) {
  const collection = await getVoteSessionCollection();
  const session = await collection.findOne({ _id: `${actorId}:${scope}` });
  if (!session) {
    return 0;
  }

  const remainingMs = toEpochMs(session.cooldownUntil) - Date.now();
  return remainingMs > 0 ? Number((remainingMs / 1000).toFixed(1)) : 0;
}

export async function getNextCooldownSec(actorId: string, scope: string, cooldownStep: number) {
  const collection = await getVoteSessionCollection();
  const session = await collection.findOne({ _id: `${actorId}:${scope}` });
  const voteCount = session?.voteCount ?? 0;
  return Number((1 + voteCount * cooldownStep).toFixed(1));
}

export async function reserveVoteSlot(actor: VoteActor, scope: string) {
  const collection = await getVoteSessionCollection();
  const key = `${actor.actorId}:${scope}`;
  const now = Date.now();
  const nowDate = new Date(now);

  const updated = await collection.findOneAndUpdate(
    {
      _id: key,
      cooldownUntil: { $lte: nowDate },
    },
    [
      {
        $set: {
          voteCount: {
            $add: [{ $ifNull: ["$voteCount", 0] }, 1],
          },
        },
      },
      {
        $set: {
          actorId: actor.actorId,
          scope,
          updatedAt: nowDate,
          cooldownUntil: {
            $dateAdd: {
              startDate: nowDate,
              unit: "millisecond",
              amount: {
                $round: [
                  {
                    $multiply: [
                      1000,
                      {
                        $add: [
                          1,
                          {
                            $multiply: [{ $subtract: ["$voteCount", 1] }, actor.cooldownStep],
                          },
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    ],
    { returnDocument: "after" }
  );

  if (updated) {
    const cooldownSec = Number((1 + (updated.voteCount - 1) * actor.cooldownStep).toFixed(1));
    return {
      allowed: true,
      cooldownSec,
      voteCount: updated.voteCount,
    };
  }

  const initialCooldownSec = Number((1 + 0 * actor.cooldownStep).toFixed(1));
  try {
    await collection.insertOne({
      _id: key,
      actorId: actor.actorId,
      scope,
      voteCount: 1,
      cooldownUntil: new Date(now + initialCooldownSec * 1000),
      updatedAt: nowDate,
    });
    return {
      allowed: true,
      cooldownSec: initialCooldownSec,
      voteCount: 1,
    };
  } catch {
    const existing = await collection.findOne({ _id: key });
    const existingCooldownUntilMs = existing ? toEpochMs(existing.cooldownUntil) : 0;
    if (existing && existingCooldownUntilMs > now) {
      return {
        allowed: false,
        cooldownSec: Number(((existingCooldownUntilMs - now) / 1000).toFixed(1)),
        voteCount: existing.voteCount,
      };
    }
    return {
      allowed: false,
      cooldownSec: 1,
      voteCount: existing?.voteCount ?? 0,
    };
  }
}

export function withAdjustedCooldown(actor: VoteActor, cooldownStep: number): VoteActor {
  return {
    ...actor,
    cooldownStep,
  };
}

function toEpochMs(value: Date | string | number) {
  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
