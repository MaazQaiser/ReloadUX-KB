import "server-only";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import type { ChunkField } from "@/lib/chunks";
import { cosineSimilarity } from "@/lib/vector";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { CHUNK_VECTOR_INDEX } from "@/server/db/indexes";
import { logger } from "@/server/logger";
import { toObjectId } from "./mongo";

const log = logger.child({ module: "project-chunks" });

async function chunks() {
  return (await getDb()).collection(COLLECTIONS.projectChunks);
}

/** A stored chunk: the text that was embedded, its hash (to skip re-embedding) and its vector. */
export interface StoredChunk {
  field: ChunkField;
  ordinal: number;
  text: string;
  hash: string;
  embedding: number[];
}

const digestSchema = z.object({ hash: z.string(), embedding: z.array(z.number()) });

/** Hash and vector of each chunk the project has now, for reusing unchanged embeddings. */
export async function listChunkEmbeddings(projectId: string): Promise<Map<string, number[]>> {
  const documents = await (await chunks())
    .find({ project_id: toObjectId(projectId) }, { projection: { _id: 0, hash: 1, embedding: 1 } })
    .toArray();
  return new Map(documents.flatMap((document) => {
    const parsed = digestSchema.safeParse(document);
    return parsed.success ? [[parsed.data.hash, parsed.data.embedding] as const] : [];
  }));
}

/** Swaps the project's chunks for a new set in one go, so a search never sees half of each. */
export async function replaceProjectChunks(projectId: string, next: readonly StoredChunk[]): Promise<void> {
  const collection = await chunks();
  const projectObjectId = toObjectId(projectId);
  const now = new Date();
  await collection.deleteMany({ project_id: projectObjectId });
  if (next.length > 0) await collection.insertMany(next.map((chunk) => ({ ...chunk, project_id: projectObjectId, updated_at: now })));
}

export interface ChunkMatch {
  projectId: string;
  field: ChunkField;
  text: string;
  score: number;
}

const matchSchema = z.object({
  project_id: z.unknown().transform(String),
  field: z.enum(["profile", "challenge", "what_we_did", "outcomes", "testimonial"]),
  text: z.string(),
  score: z.number(),
});

const storedSchema = matchSchema.omit({ score: true }).extend({ embedding: z.array(z.number()) });

// Plain MongoDB (local development, tests) doesn't know $vectorSearch; Atlas without search does
// the same with a different code. Either way the in-app fallback below answers instead.
const VECTOR_SEARCH_UNAVAILABLE = new Set([40324, 31082, 6047401]);
let warnedFallback = false;

/** Similarity across every chunk in memory. Fine for a few thousand chunks; Atlas does it properly. */
async function similarChunksInApp(vector: readonly number[], limit: number): Promise<ChunkMatch[]> {
  const documents = await (await chunks()).find({}, { projection: { _id: 0, project_id: 1, field: 1, text: 1, embedding: 1 } }).toArray();
  return documents
    .flatMap((document) => {
      const parsed = storedSchema.safeParse(document);
      if (!parsed.success) return [];
      const { project_id, field, text, embedding } = parsed.data;
      return [{ projectId: project_id, field, text, score: cosineSimilarity(vector, embedding) }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** The chunks closest in meaning to the query vector, best first. Uses Atlas Vector Search when available. */
export async function findSimilarChunks(vector: readonly number[], limit: number): Promise<ChunkMatch[]> {
  try {
    const documents = await (await chunks())
      .aggregate([
        { $vectorSearch: { index: CHUNK_VECTOR_INDEX, path: "embedding", queryVector: [...vector], numCandidates: limit * 10, limit } },
        { $project: { _id: 0, project_id: 1, field: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray();
    return documents.flatMap((document) => {
      const parsed = matchSchema.safeParse(document);
      return parsed.success ? [{ projectId: parsed.data.project_id, field: parsed.data.field, text: parsed.data.text, score: parsed.data.score }] : [];
    });
  } catch (error) {
    if (!(error instanceof MongoServerError && typeof error.code === "number" && VECTOR_SEARCH_UNAVAILABLE.has(error.code))) throw error;
    if (!warnedFallback) {
      log.warn("Atlas Vector Search isn't available here; matching chunks in the app instead", { code: error.code });
      warnedFallback = true;
    }
    return similarChunksInApp(vector, limit);
  }
}
