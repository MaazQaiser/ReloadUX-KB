import "server-only";
import { err, ok, toValidationIssues, type Result, type ValidationIssue } from "@/lib/result";
import type { GapResolution, KnowledgeGap } from "@/schemas/knowledge-gap";
import type { User } from "@/schemas/user";
import { verifiedAnswerInputSchema, type VerifiedAnswer, type VerifiedAnswerInput } from "@/schemas/verified-answer";
import { getAskStats, type AskStats } from "@/server/repositories/conversations";
import { listOpenGaps, resolveGap } from "@/server/repositories/knowledge-gaps";
import { findProjectBySlug } from "@/server/repositories/projects";
import {
  insertVerifiedAnswer,
  listVerifiedAnswers,
  softDeleteVerifiedAnswer,
  updateVerifiedAnswer,
} from "@/server/repositories/verified-answers";

export { listOpenGaps, listVerifiedAnswers };

export async function getAskAnalytics(weeks = 8): Promise<AskStats> {
  return getAskStats(weeks);
}

export async function closeGap(admin: User, id: string, type: GapResolution, note?: string): Promise<Result<KnowledgeGap, "not_found">> {
  const resolved = await resolveGap(id, { type, note, by: admin.id });
  return resolved ? ok(resolved) : err("not_found");
}

export type VerifiedAnswerError =
  | { kind: "invalid"; issues: ValidationIssue[] }
  | { kind: "unknown_projects"; slugs: string[] }
  | { kind: "not_found" };

/** Verified answers may only point at live projects, so the agent never cites a missing record. */
async function checkInput(input: VerifiedAnswerInput) {
  const parsed = verifiedAnswerInputSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "invalid" as const, issues: toValidationIssues(parsed.error) });
  const found = await Promise.all(parsed.data.project_slugs.map((slug) => findProjectBySlug(slug)));
  const unknown = parsed.data.project_slugs.filter((_, index) => !found[index]);
  if (unknown.length > 0) return err({ kind: "unknown_projects" as const, slugs: unknown });
  return ok(parsed.data);
}

export async function saveVerifiedAnswer(
  admin: User,
  input: VerifiedAnswerInput,
  id?: string,
): Promise<Result<VerifiedAnswer, VerifiedAnswerError>> {
  const checked = await checkInput(input);
  if (!checked.ok) return checked;
  if (!id) return ok(await insertVerifiedAnswer(checked.value, admin.id));
  const updated = await updateVerifiedAnswer(id, checked.value, admin.id);
  return updated ? ok(updated) : err({ kind: "not_found" });
}

export async function removeVerifiedAnswer(admin: User, id: string): Promise<boolean> {
  return softDeleteVerifiedAnswer(id, admin.id);
}
