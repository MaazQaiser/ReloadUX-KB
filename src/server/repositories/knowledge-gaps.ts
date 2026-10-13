import "server-only";
import type { Document, WithId } from "mongodb";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { knowledgeGapSchema, type GapResolution, type KnowledgeGap } from "@/schemas/knowledge-gap";
import { fromDocument, toObjectId } from "./mongo";

async function gaps() {
  return (await getDb()).collection(COLLECTIONS.knowledgeGaps);
}

function toGap(document: WithId<Document>): KnowledgeGap {
  return fromDocument(knowledgeGapSchema, COLLECTIONS.knowledgeGaps, {
    ...document,
    user_id: String(document.user_id),
    ...(document.resolution && { resolution: { ...document.resolution, by: String(document.resolution.by) } }),
  });
}

export async function insertGap(gap: Pick<KnowledgeGap, "question" | "reason" | "note" | "turn_id" | "user_id">): Promise<void> {
  await (await gaps()).insertOne({
    ...gap,
    user_id: toObjectId(gap.user_id),
    status: "open",
    created_at: new Date(),
  });
}

export async function listOpenGaps(): Promise<KnowledgeGap[]> {
  const documents = await (await gaps()).find({ status: "open" }).sort({ created_at: -1 }).limit(200).toArray();
  return documents.map(toGap);
}

export async function resolveGap(
  id: string,
  resolution: { type: GapResolution; note?: string; by: string },
): Promise<KnowledgeGap | null> {
  const saved = await (await gaps()).findOneAndUpdate(
    { _id: toObjectId(id), status: "open" },
    { $set: { status: "resolved", resolution: { ...resolution, by: toObjectId(resolution.by), at: new Date() } } },
    { returnDocument: "after" },
  );
  return saved ? toGap(saved) : null;
}
