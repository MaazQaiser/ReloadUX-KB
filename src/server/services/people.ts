import "server-only";
import { err, ok, toValidationIssues, type Result, type ValidationIssue } from "@/lib/result";
import type { Actor } from "@/schemas/common";
import { personInputSchema, type Person, type PersonInput } from "@/schemas/person";
import { upsertPersonBySlug } from "@/server/repositories/people";

export type SavePersonError = { kind: "invalid"; issues: ValidationIssue[] };

export async function savePerson(input: PersonInput, actor: Actor): Promise<Result<Person, SavePersonError>> {
  const parsed = personInputSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "invalid", issues: toValidationIssues(parsed.error) });
  return ok(await upsertPersonBySlug(parsed.data, actor));
}
