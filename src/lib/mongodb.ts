import { MongoClient } from "mongodb";

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri);
    await globalWithMongo._mongoClient.connect();
  }

  return globalWithMongo._mongoClient;
}

export function getMongoDbName() {
  const explicit = process.env.MONGODB_DB?.trim();
  if (explicit) {
    return explicit;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  try {
    const parsed = new URL(uri);
    const pathDb = parsed.pathname.replace("/", "").trim();
    if (pathDb) {
      return pathDb;
    }
  } catch {
    // ignore URI parse issue and fall back below
  }

  return "kormanyvalto";
}
