import { randomUUID } from "node:crypto";
import { afterAll, inject } from "vitest";

// One database per test file, so files can run in parallel without sharing data.
process.env.MONGODB_URI = inject("mongoUri");
process.env.MONGODB_DB = `test_${randomUUID().replaceAll("-", "").slice(0, 16)}`;

afterAll(async () => {
  const { closeMongoClient, getDb } = await import("@/server/db/client");
  await (await getDb()).dropDatabase();
  await closeMongoClient();
});
