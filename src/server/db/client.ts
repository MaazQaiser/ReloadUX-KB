import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getServerEnv } from "@/env";

// Dev hot reloads re-evaluate this module; keeping the client on globalThis
// stops every reload from opening a new connection pool.
const store = globalThis as typeof globalThis & { reloaduxMongo?: Promise<MongoClient> };

export function getMongoClient(): Promise<MongoClient> {
  if (!store.reloaduxMongo) {
    const client = new MongoClient(getServerEnv().MONGODB_URI, {
      appName: "reloadux-kb",
      // Serverless functions each hold their own pool; keep them small.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
    store.reloaduxMongo = client.connect().catch((error: unknown) => {
      // Let the next call retry instead of caching a failed connection forever.
      store.reloaduxMongo = undefined;
      throw error;
    });
  }
  return store.reloaduxMongo;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getServerEnv().MONGODB_DB);
}

/** For scripts and tests; app code keeps the client open for the process lifetime. */
export async function closeMongoClient(): Promise<void> {
  const pending = store.reloaduxMongo;
  store.reloaduxMongo = undefined;
  if (pending) await (await pending).close();
}
