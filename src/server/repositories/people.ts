import "server-only";
import { MongoServerError } from "mongodb";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { personInputSchema, personSchema, type Person, type PersonInput } from "@/schemas/person";
import type { PersonRole } from "@/schemas/tags";
import { actorSchema, type Actor } from "@/schemas/common";
import { fromDocument, toObjectId, toUpdate } from "./mongo";

const NOT_DELETED = { deleted_at: { $exists: false } };

async function people() {
  return (await getDb()).collection(COLLECTIONS.people);
}

function toPerson(document: Parameters<typeof fromDocument>[2]): Person {
  return fromDocument(personSchema, COLLECTIONS.people, document);
}

/**
 * Creates or updates the person with this slug. Matching by slug is what
 * makes seed and import scripts safe to run twice.
 */
export async function upsertPersonBySlug(input: PersonInput, actor: Actor): Promise<Person> {
  const person = personInputSchema.parse(input);
  // Every optional field is listed so leaving one out of the input clears it.
  const { $set, $unset } = toUpdate({ email: undefined, ...person });

  const saved = await (await people()).findOneAndUpdate(
    { slug: person.slug },
    {
      $set: { ...$set, updated_by: actorSchema.parse(actor), updated_at: new Date() },
      ...(Object.keys($unset).length > 0 && { $unset }),
    },
    { upsert: true, returnDocument: "after" },
  );
  // Safe: with upsert and returnDocument "after", Mongo always returns the document.
  return toPerson(saved!);
}

const DUPLICATE_KEY = 11000;

/** Inserts a new person; null when the slug is already taken (the unique index decides). */
export async function insertPerson(input: PersonInput, actor: Actor): Promise<Person | null> {
  const person = personInputSchema.parse(input);
  const document = { ...person, updated_by: actorSchema.parse(actor), updated_at: new Date() };
  try {
    const { insertedId } = await (await people()).insertOne(document);
    return toPerson({ _id: insertedId, ...document });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) return null;
    throw error;
  }
}

export async function findPersonBySlug(slug: string): Promise<Person | null> {
  const document = await (await people()).findOne({ slug, ...NOT_DELETED });
  return document ? toPerson(document) : null;
}

/**
 * Includes soft-deleted people: a project keeps pointing at whoever led it,
 * and the record should still show their name.
 */
export async function findPeopleByIds(ids: readonly string[]): Promise<Person[]> {
  if (ids.length === 0) return [];
  const documents = await (await people()).find({ _id: { $in: ids.map(toObjectId) } }).toArray();
  return documents.map(toPerson);
}

export interface ListPeopleOptions {
  role?: PersonRole;
  activeOnly?: boolean;
}

/** For pickers and filters, sorted by name. */
export async function listPeople({ role, activeOnly = false }: ListPeopleOptions = {}): Promise<Person[]> {
  const documents = await (await people())
    .find({
      ...NOT_DELETED,
      ...(role && { roles: role }),
      ...(activeOnly && { active: true }),
    })
    .sort({ name: 1 })
    .collation({ locale: "en", strength: 2 })
    .toArray();
  return documents.map(toPerson);
}
