import { kv } from "@vercel/kv";

export type VoteType = "yes" | "no";

export type ClickStore = {
  yes: string[];
  no: string[];
};

const KEY_YES = "votes:yes";
const KEY_NO = "votes:no";

export async function getResults(): Promise<ClickStore> {
  const [yes, no] = await Promise.all([
    kv.lrange<string>(KEY_YES, 0, -1),
    kv.lrange<string>(KEY_NO, 0, -1),
  ]);

  return {
    yes: yes ?? [],
    no: no ?? [],
  };
}

export async function addVote(type: VoteType): Promise<ClickStore> {
  const key = type === "yes" ? KEY_YES : KEY_NO;
  await kv.lpush(key, new Date().toISOString());
  return getResults();
}
