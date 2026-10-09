import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { INDEXES, syncIndexes, type IndexDefinition } from "@/server/db/indexes";

async function indexNames(collection: string): Promise<string[]> {
  const db = await getDb();
  const indexes = await db.collection(collection).listIndexes().toArray();
  return indexes.map((index) => String(index.name)).sort();
}

beforeEach(async () => {
  const db = await getDb();
  await db.dropDatabase();
});

describe("getDb", () => {
  it("connects to the configured database", async () => {
    const db = await getDb();
    expect(db.databaseName).toBe(process.env.MONGODB_DB);
    await expect(db.command({ ping: 1 })).resolves.toMatchObject({ ok: 1 });
  });

  it("returns the same client on repeated calls", async () => {
    const [first, second] = await Promise.all([getDb(), getDb()]);
    expect(first.client).toBe(second.client);
  });
});

describe("syncIndexes", () => {
  it("creates every defined index on an empty database", async () => {
    const db = await getDb();
    const results = await syncIndexes(db, { dryRun: false });

    expect(results.every((result) => result.action === "create")).toBe(true);
    expect(results).toHaveLength(INDEXES.length);
    expect(await indexNames(COLLECTIONS.projects)).toEqual(["_id_", "slug_unique"]);
    expect(await indexNames(COLLECTIONS.users)).toEqual(["_id_", "email_unique", "firebase_uid_unique"]);
  });

  it("is safe to run twice", async () => {
    const db = await getDb();
    await syncIndexes(db, { dryRun: false });
    const second = await syncIndexes(db, { dryRun: false });

    expect(second.every((result) => result.action === "unchanged")).toBe(true);
  });

  it("writes nothing on a dry run", async () => {
    const db = await getDb();
    const results = await syncIndexes(db, { dryRun: true });

    expect(results.every((result) => result.action === "create")).toBe(true);
    expect(await db.listCollections().toArray()).toEqual([]);
  });

  it("enforces unique slugs", async () => {
    const db = await getDb();
    await syncIndexes(db, { dryRun: false });
    const projects = db.collection(COLLECTIONS.projects);
    await projects.insertOne({ slug: "vocable" });

    await expect(projects.insertOne({ slug: "vocable" })).rejects.toMatchObject({ code: 11000 });
  });

  it("reports a same-name index with a different definition as a conflict and leaves it", async () => {
    const db = await getDb();
    await db.collection(COLLECTIONS.projects).createIndex({ slug: 1 }, { name: "slug_unique" });
    const definitions: IndexDefinition[] = INDEXES.filter((d) => d.collection === COLLECTIONS.projects);

    const results = await syncIndexes(db, { dryRun: false, definitions });

    expect(results).toEqual([{ collection: "projects", name: "slug_unique", action: "conflict" }]);
    const existing = await db.collection(COLLECTIONS.projects).listIndexes().toArray();
    expect(existing.find((index) => index.name === "slug_unique")?.unique).toBeUndefined();
  });
});
