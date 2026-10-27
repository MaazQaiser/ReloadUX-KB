import { afterAll, beforeAll } from "vitest";

// One in-memory Postgres (PGlite) per test file, so files can run in parallel without sharing data.
process.env.DATABASE_URL = "pglite:memory";

beforeAll(async () => {
  const { migrateDb } = await import("@/server/db/client");
  await migrateDb();
});

afterAll(async () => {
  const { closeDb } = await import("@/server/db/client");
  await closeDb();
});
