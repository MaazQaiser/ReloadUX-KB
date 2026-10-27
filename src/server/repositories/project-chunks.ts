import "server-only";
import { asc, cosineDistance, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { ChunkField } from "@/lib/chunks";
import { getDb } from "@/server/db/client";
import { projectChunks } from "@/server/db/schema";
import { newId } from "./rows";

/** A stored chunk: the text that was embedded, its hash (to skip re-embedding) and its vector. */
export interface StoredChunk {
  field: ChunkField;
  ordinal: number;
  text: string;
  hash: string;
  embedding: number[];
}

/** Hash and vector of each chunk the project has now, for reusing unchanged embeddings. */
export async function listChunkEmbeddings(projectId: string): Promise<Map<string, number[]>> {
  const rows = await (await getDb())
    .select({ hash: projectChunks.hash, embedding: projectChunks.embedding })
    .from(projectChunks)
    .where(eq(projectChunks.project_id, projectId));
  return new Map(rows.map((row) => [row.hash, row.embedding]));
}

/** Swaps the project's chunks for a new set in one transaction, so a search never sees half of each. */
export async function replaceProjectChunks(projectId: string, next: readonly StoredChunk[]): Promise<void> {
  const now = new Date();
  await (await getDb()).transaction(async (tx) => {
    await tx.delete(projectChunks).where(eq(projectChunks.project_id, projectId));
    if (next.length > 0) {
      await tx.insert(projectChunks).values(next.map((chunk) => ({ id: newId(), ...chunk, project_id: projectId, updated_at: now })));
    }
  });
}

export interface ChunkMatch {
  projectId: string;
  field: ChunkField;
  text: string;
  score: number;
}

const fieldSchema = z.enum(["profile", "challenge", "what_we_did", "outcomes", "testimonial"]);

/** The chunks closest in meaning to the query vector, best first (pgvector, HNSW index on cosine distance). */
export async function findSimilarChunks(vector: readonly number[], limit: number): Promise<ChunkMatch[]> {
  const distance = cosineDistance(projectChunks.embedding, [...vector]);
  const rows = await (await getDb())
    .select({ projectId: projectChunks.project_id, field: projectChunks.field, text: projectChunks.text, score: sql<number>`1 - (${distance})`.mapWith(Number) })
    .from(projectChunks)
    .orderBy(asc(distance))
    .limit(limit);
  return rows.flatMap((row) => {
    const field = fieldSchema.safeParse(row.field);
    return field.success ? [{ ...row, field: field.data }] : [];
  });
}
