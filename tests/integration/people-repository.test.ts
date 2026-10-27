import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { people } from "@/server/db/schema";
import { CorruptRowError } from "@/server/repositories/rows";
import {
  findPeopleByIds,
  findPersonBySlug,
  insertPerson,
  listPeople,
  upsertPersonBySlug,
} from "@/server/repositories/people";
import { resetDatabase } from "./database";

const SEED = "system:seed";
const sara = { name: "Sara Khan", slug: "sara-khan", email: "sara@reloadux.com", roles: ["designer" as const] };
const omar = { name: "omar Ali", slug: "omar-ali", roles: ["account_manager" as const] };
const bea = { name: "Bea Ruiz", slug: "bea-ruiz", roles: ["designer" as const], active: false };

async function rowCount() {
  return (await getDb()).$count(people);
}

async function setColumns(slug: string, values: Partial<typeof people.$inferInsert>) {
  await (await getDb()).update(people).set(values).where(eq(people.slug, slug));
}

beforeEach(async () => {
  await resetDatabase();
});

describe("upsertPersonBySlug", () => {
  it("creates a person with audit fields and a string id", async () => {
    const before = Date.now();
    const person = await upsertPersonBySlug(sara, SEED);

    expect(person).toMatchObject({ ...sara, active: true, updated_by: SEED });
    expect(person.id).toMatch(/^[a-f0-9]{24}$/);
    expect(person.updated_at.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("updates the same record when run again with the same slug", async () => {
    const first = await upsertPersonBySlug(sara, SEED);
    const second = await upsertPersonBySlug({ ...sara, name: "Sara K." }, SEED);

    expect(second.id).toBe(first.id);
    expect(second.name).toBe("Sara K.");
    expect(await rowCount()).toBe(1);
  });

  it("clears an optional field left out of the update", async () => {
    await upsertPersonBySlug(sara, SEED);
    const updated = await upsertPersonBySlug({ name: sara.name, slug: sara.slug, roles: sara.roles }, SEED);

    expect(updated).not.toHaveProperty("email");
    const [raw] = await (await getDb()).select({ email: people.email }).from(people).where(eq(people.slug, sara.slug));
    expect(raw?.email).toBeNull();
  });

  it("validates input and the actor before writing", async () => {
    await expect(upsertPersonBySlug({ ...sara, roles: [] }, SEED)).rejects.toThrow();
    await expect(upsertPersonBySlug(sara, "someone")).rejects.toThrow();
    expect(await rowCount()).toBe(0);
  });
});

describe("reads", () => {
  it("finds by slug, skipping soft-deleted people", async () => {
    await upsertPersonBySlug(sara, SEED);
    expect(await findPersonBySlug("sara-khan")).toMatchObject({ name: "Sara Khan" });

    await setColumns("sara-khan", { deleted_at: new Date() });
    expect(await findPersonBySlug("sara-khan")).toBeNull();
    expect(await findPersonBySlug("nobody")).toBeNull();
  });

  it("finds by ids, including soft-deleted people", async () => {
    const a = await upsertPersonBySlug(sara, SEED);
    const b = await upsertPersonBySlug(omar, SEED);
    await setColumns("omar-ali", { deleted_at: new Date() });

    const found = await findPeopleByIds([a.id, b.id]);
    expect(found.map((person) => person.slug).sort()).toEqual(["omar-ali", "sara-khan"]);
    expect(await findPeopleByIds([])).toEqual([]);
  });

  it("lists by name (case-insensitive), with role and active filters", async () => {
    await upsertPersonBySlug(sara, SEED);
    await upsertPersonBySlug(omar, SEED);
    await upsertPersonBySlug(bea, SEED);

    expect((await listPeople()).map((p) => p.name)).toEqual(["Bea Ruiz", "omar Ali", "Sara Khan"]);
    expect((await listPeople({ role: "designer" })).map((p) => p.slug)).toEqual(["bea-ruiz", "sara-khan"]);
    expect((await listPeople({ role: "designer", activeOnly: true })).map((p) => p.slug)).toEqual(["sara-khan"]);
  });

  it("raises CorruptRowError for a record edited into an invalid shape", async () => {
    await upsertPersonBySlug(sara, SEED);
    await setColumns("sara-khan", { roles: ["ceo"] });

    await expect(findPersonBySlug("sara-khan")).rejects.toBeInstanceOf(CorruptRowError);
  });
});

describe("insertPerson", () => {
  it("inserts once and returns null for a taken slug", async () => {
    expect(await insertPerson(sara, SEED)).toMatchObject({ slug: "sara-khan", active: true, updated_by: SEED });
    expect(await insertPerson({ ...sara, name: "Another Sara" }, SEED)).toBeNull();
    expect(await rowCount()).toBe(1);
  });
});
