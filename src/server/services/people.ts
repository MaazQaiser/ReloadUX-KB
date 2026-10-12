import "server-only";
import { err, ok, toValidationIssues, type Result, type ValidationIssue } from "@/lib/result";
import { toSlug } from "@/lib/slug";
import type { Actor } from "@/schemas/common";
import { personInputSchema, type Person, type PersonInput } from "@/schemas/person";
import type { PersonRole } from "@/schemas/tags";
import { findPersonBySlug, insertPerson, listPeople, upsertPersonBySlug } from "@/server/repositories/people";

export type SavePersonError = { kind: "invalid"; issues: ValidationIssue[] };

/** Create-or-update by slug, for seeds and imports. */
export async function savePerson(input: PersonInput, actor: Actor): Promise<Result<Person, SavePersonError>> {
  const parsed = personInputSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "invalid", issues: toValidationIssues(parsed.error) });
  return ok(await upsertPersonBySlug(parsed.data, actor));
}

export type CreatePersonError = SavePersonError | { kind: "person_exists"; person: Person | null };

/**
 * Adds a person from the project form. The slug comes from the name; if
 * someone already has it, the caller gets them back to pick instead.
 */
export async function createPerson(
  input: { name: string; roles: PersonRole[] },
  actor: Actor,
): Promise<Result<Person, CreatePersonError>> {
  const parsed = personInputSchema.safeParse({ ...input, slug: toSlug(input.name) });
  if (!parsed.success) return err({ kind: "invalid", issues: toValidationIssues(parsed.error) });

  const created = await insertPerson(parsed.data, actor);
  if (created) return ok(created);
  return err({ kind: "person_exists", person: await findPersonBySlug(parsed.data.slug) });
}

/** Everyone a project can reference, active or not, sorted by name. */
export async function listPeopleForForm(): Promise<Person[]> {
  return listPeople();
}
