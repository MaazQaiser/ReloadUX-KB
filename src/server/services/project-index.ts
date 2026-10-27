import "server-only";
import { createHash } from "node:crypto";
import { getAiConfig } from "@/env";
import { buildProjectChunks } from "@/lib/chunks";
import type { TagCatalog } from "@/lib/tag-catalog";
import type { Project } from "@/schemas/project";
import { AI_CONFIG } from "@/server/ai/config";
import { embed } from "@/server/ai/voyage";
import { logger } from "@/server/logger";
import { listChunkEmbeddings, replaceProjectChunks, type StoredChunk } from "@/server/repositories/project-chunks";

const log = logger.child({ module: "project-index" });

export type IndexOutcome =
  | { status: "indexed"; chunks: number; embedded: number }
  | { status: "skipped"; reason: "no_voyage_key" }
  | { status: "failed" };

/** The model and size are part of the hash, so changing either re-embeds everything on the next save. */
function chunkHash(text: string): string {
  const { embedModel, dimensions } = AI_CONFIG.voyage;
  return createHash("sha256").update(`${embedModel}:${dimensions}:${text}`).digest("hex");
}

/** What indexing would do: every chunk, the vectors already stored, and the chunks still to embed. */
export async function planProjectIndex(project: Project, catalog: TagCatalog) {
  const chunks = buildProjectChunks(project, catalog, AI_CONFIG.chunks.maxChars).map((chunk) => ({ ...chunk, hash: chunkHash(chunk.text) }));
  const existing = await listChunkEmbeddings(project.id);
  return { chunks, existing, missing: chunks.filter((chunk) => !existing.has(chunk.hash)) };
}

/**
 * Rebuilds a project's search chunks after a save. Unchanged text keeps its
 * vector; only new or edited chunks go to Voyage. Never throws: a project
 * must save even when embedding fails, and `pnpm db:embed` catches it up later.
 */
export async function indexProject(project: Project, catalog: TagCatalog): Promise<IndexOutcome> {
  if (!getAiConfig().voyageApiKey) return { status: "skipped", reason: "no_voyage_key" };
  try {
    const { chunks, existing, missing } = await planProjectIndex(project, catalog);
    const vectors = missing.length > 0 ? await embed(missing.map((chunk) => chunk.text), "document") : [];
    const fresh = new Map(missing.map((chunk, index) => [chunk.hash, vectors[index]]));

    const stored: StoredChunk[] = chunks.flatMap((chunk) => {
      const embedding = existing.get(chunk.hash) ?? fresh.get(chunk.hash);
      return embedding ? [{ ...chunk, embedding }] : [];
    });
    await replaceProjectChunks(project.id, stored);
    return { status: "indexed", chunks: stored.length, embedded: missing.length };
  } catch (error) {
    log.error("project indexing failed; it will be retried by pnpm db:embed", { projectId: project.id, error });
    return { status: "failed" };
  }
}
