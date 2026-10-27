import "server-only";
import { and, arrayContains, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { people } from "@/server/db/schema";
import { personInputSchema, personSchema, type Person, type PersonInput } from "@/schemas/person";
import type { PersonRole } from "@/schemas/tags";
import { actorSchema, type Actor } from "@/schemas/common";
import { fromRow, newId, withNulls } from "./rows";

function toPerson(row: typeof people.$inferSelect): Person {
  return fromRow(personSchema, "people", row);
}

function toPersonWrite(input: PersonInput, actor: Actor) {
  // Every optional field is listed so leaving one out of the input clears it.
  return { ...withNulls(personInputSchema.parse(input), ["email"]), updated_by: actorSchema.parse(actor), updated_at: new Date() };
}

/**
 * Creates or updates the person with this slug. Matching by slug is what
 * makes seed and import scripts safe to run twice.
 */
export async function upsertPersonBySlug(input: PersonInput, actor: Actor): Promise<Person> {
  const values = toPersonWrite(input, actor);
  const [saved] = await (await getDb())
    .insert(people)
    .values({ id: newId(), ...values })
    .onConflictDoUpdate({ target: people.slug, set: values })
    .returning();
  // Safe: an upsert always returns its row.
  return toPerson(saved!);
}

/** Inserts a new person; null when the slug is already taken (the unique index decides). */
export async function insertPerson(input: PersonInput, actor: Actor): Promise<Person | null> {
  const [saved] = await (await getDb())
    .insert(people)
    .values({ id: newId(), ...toPersonWrite(input, actor) })
    .onConflictDoNothing({ target: people.slug })
    .returning();
  return saved ? toPerson(saved) : null;
}

export async function findPersonBySlug(slug: string): Promise<Person | null> {
  const [row] = await (await getDb()).select().from(people).where(and(eq(people.slug, slug), isNull(people.deleted_at))).limit(1);
  return row ? toPerson(row) : null;
}

/**
 * Includes soft-deleted people: a project keeps pointing at whoever led it,
 * and the record should still show their name.
 */
export async function findPeopleByIds(ids: readonly string[]): Promise<Person[]> {
  if (ids.length === 0) return [];
  const rows = await (await getDb()).select().from(people).where(inArray(people.id, [...ids]));
  return rows.map(toPerson);
}

export interface ListPeopleOptions {
  role?: PersonRole;
  activeOnly?: boolean;
}

/** For pickers and filters, sorted by name. */
export async function listPeople({ role, activeOnly = false }: ListPeopleOptions = {}): Promise<Person[]> {
  const rows = await (await getDb())
    .select()
    .from(people)
    .where(and(isNull(people.deleted_at), role && arrayContains(people.roles, [role]), activeOnly ? eq(people.active, true) : undefined))
    .orderBy(asc(sql`lower(${people.name})`));
  return rows.map(toPerson);
}
