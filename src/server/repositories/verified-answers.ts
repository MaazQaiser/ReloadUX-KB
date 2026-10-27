import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { verifiedAnswers } from "@/server/db/schema";
import { actorSchema, type Actor } from "@/schemas/common";
import { verifiedAnswerInputSchema, verifiedAnswerSchema, type VerifiedAnswer, type VerifiedAnswerInput } from "@/schemas/verified-answer";
import { fromRow, newId } from "./rows";

const LIVE = isNull(verifiedAnswers.deleted_at);

function toVerifiedAnswer(row: typeof verifiedAnswers.$inferSelect): VerifiedAnswer {
  return fromRow(verifiedAnswerSchema, "verified_answers", row);
}

export async function listVerifiedAnswers(): Promise<VerifiedAnswer[]> {
  const rows = await (await getDb()).select().from(verifiedAnswers).where(LIVE).orderBy(desc(verifiedAnswers.updated_at));
  return rows.map(toVerifiedAnswer);
}

export async function insertVerifiedAnswer(input: VerifiedAnswerInput, actor: Actor): Promise<VerifiedAnswer> {
  const fields = verifiedAnswerInputSchema.parse(input);
  const by = actorSchema.parse(actor);
  const now = new Date();
  const [saved] = await (await getDb())
    .insert(verifiedAnswers)
    .values({ id: newId(), ...fields, created_by: by, created_at: now, updated_by: by, updated_at: now })
    .returning();
  // Safe: an insert without a conflict clause returns its row or throws.
  return toVerifiedAnswer(saved!);
}

export async function updateVerifiedAnswer(id: string, input: VerifiedAnswerInput, actor: Actor): Promise<VerifiedAnswer | null> {
  const fields = verifiedAnswerInputSchema.parse(input);
  const [saved] = await (await getDb())
    .update(verifiedAnswers)
    .set({ ...fields, updated_by: actorSchema.parse(actor), updated_at: new Date() })
    .where(and(eq(verifiedAnswers.id, id), LIVE))
    .returning();
  return saved ? toVerifiedAnswer(saved) : null;
}

/** Soft delete: the agent stops using it, the record stays for the audit trail. */
export async function softDeleteVerifiedAnswer(id: string, actor: Actor): Promise<boolean> {
  const now = new Date();
  const saved = await (await getDb())
    .update(verifiedAnswers)
    .set({ deleted_at: now, updated_by: actorSchema.parse(actor), updated_at: now })
    .where(and(eq(verifiedAnswers.id, id), LIVE))
    .returning({ id: verifiedAnswers.id });
  return saved.length === 1;
}
