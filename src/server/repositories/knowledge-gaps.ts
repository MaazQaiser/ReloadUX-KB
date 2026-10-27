import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { knowledgeGaps } from "@/server/db/schema";
import { knowledgeGapSchema, type GapResolution, type KnowledgeGap } from "@/schemas/knowledge-gap";
import { fromRow, newId } from "./rows";

function toGap(row: typeof knowledgeGaps.$inferSelect): KnowledgeGap {
  const resolution = row.resolution && { ...row.resolution, at: new Date(row.resolution.at) };
  return fromRow(knowledgeGapSchema, "knowledge_gaps", { ...row, resolution });
}

export async function insertGap(gap: Pick<KnowledgeGap, "question" | "reason" | "note" | "turn_id" | "user_id">): Promise<void> {
  await (await getDb()).insert(knowledgeGaps).values({ id: newId(), ...gap, status: "open", created_at: new Date() });
}

export async function listOpenGaps(): Promise<KnowledgeGap[]> {
  const rows = await (await getDb())
    .select()
    .from(knowledgeGaps)
    .where(eq(knowledgeGaps.status, "open"))
    .orderBy(desc(knowledgeGaps.created_at))
    .limit(200);
  return rows.map(toGap);
}

export async function resolveGap(
  id: string,
  resolution: { type: GapResolution; note?: string; by: string },
): Promise<KnowledgeGap | null> {
  const [saved] = await (await getDb())
    .update(knowledgeGaps)
    .set({ status: "resolved", resolution: { ...resolution, at: new Date().toISOString() } })
    .where(and(eq(knowledgeGaps.id, id), eq(knowledgeGaps.status, "open")))
    .returning();
  return saved ? toGap(saved) : null;
}
