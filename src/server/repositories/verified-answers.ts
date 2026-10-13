import "server-only";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { actorSchema, type Actor } from "@/schemas/common";
import { verifiedAnswerInputSchema, verifiedAnswerSchema, type VerifiedAnswer, type VerifiedAnswerInput } from "@/schemas/verified-answer";
import { fromDocument, toObjectId } from "./mongo";

const LIVE = { deleted_at: { $exists: false } };

async function answers() {
  return (await getDb()).collection(COLLECTIONS.verifiedAnswers);
}

export async function listVerifiedAnswers(): Promise<VerifiedAnswer[]> {
  const documents = await (await answers()).find(LIVE).sort({ updated_at: -1 }).toArray();
  return documents.map((document) => fromDocument(verifiedAnswerSchema, COLLECTIONS.verifiedAnswers, document));
}

export async function insertVerifiedAnswer(input: VerifiedAnswerInput, actor: Actor): Promise<VerifiedAnswer> {
  const fields = verifiedAnswerInputSchema.parse(input);
  const by = actorSchema.parse(actor);
  const now = new Date();
  const document = { ...fields, created_by: by, created_at: now, updated_by: by, updated_at: now };
  const { insertedId } = await (await answers()).insertOne(document);
  return fromDocument(verifiedAnswerSchema, COLLECTIONS.verifiedAnswers, { _id: insertedId, ...document });
}

export async function updateVerifiedAnswer(id: string, input: VerifiedAnswerInput, actor: Actor): Promise<VerifiedAnswer | null> {
  const fields = verifiedAnswerInputSchema.parse(input);
  const saved = await (await answers()).findOneAndUpdate(
    { _id: toObjectId(id), ...LIVE },
    { $set: { ...fields, updated_by: actorSchema.parse(actor), updated_at: new Date() } },
    { returnDocument: "after" },
  );
  return saved ? fromDocument(verifiedAnswerSchema, COLLECTIONS.verifiedAnswers, saved) : null;
}

/** Soft delete: the agent stops using it, the record stays for the audit trail. */
export async function softDeleteVerifiedAnswer(id: string, actor: Actor): Promise<boolean> {
  const result = await (await answers()).updateOne(
    { _id: toObjectId(id), ...LIVE },
    { $set: { deleted_at: new Date(), updated_by: actorSchema.parse(actor), updated_at: new Date() } },
  );
  return result.modifiedCount === 1;
}
