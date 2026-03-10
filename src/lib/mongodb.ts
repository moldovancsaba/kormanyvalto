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
