import "server-only";
import { getAiConfig } from "@/env";
import { buildProjectChunks } from "@/lib/chunks";
import { escapeRegExp } from "@/lib/regex";
import { tagLabel, type TagCatalog } from "@/lib/tag-catalog";
import type { Project } from "@/schemas/project";
import { AI_CONFIG } from "@/server/ai/config";
import { embed, rerank } from "@/server/ai/voyage";
import { logger } from "@/server/logger";
import { findSimilarChunks } from "@/server/repositories/project-chunks";
import { findProjectsByKeywords, findVisibleProjectsByIds, type SearchFilters } from "@/server/repositories/project-search";
import { getTagCatalog } from "@/server/services/tags";

const log = logger.child({ module: "search" });

/** Why a project came back, so the agent can say "matches because…" without guessing. */
export interface MatchReason {
  /** The project's tag labels that the question names, e.g. "healthcare", "chatbot". */
  tags: string[];
  /** The passage of the record closest in meaning to the question, when vector search found one. */
  passage?: string;
  /** True when the question's words appear in the record itself. */
  keyword: boolean;
}

export interface ProjectSearchResult {
  project: Project;
  /** 0 to 1, higher is closer. Reranker relevance when Voyage is connected, else a fused rank score. */
  score: number;
  why: MatchReason;
}

interface Candidate {
  project: Project;
  fused: number;
  passage?: string;
  keyword: boolean;
}

// Reciprocal rank fusion: each list contributes 1 / (K + rank). K = 60 is the usual damping.
const RRF_K = 60;
const VECTOR_CHUNKS = 100;
const PASSAGE_CHARS = 400;

function namedTags(project: Project, query: string, catalog: TagCatalog): string[] {
  const labels = [
    tagLabel(catalog.industry, project.industry),
    ...project.product_types.map((key) => tagLabel(catalog.product_types, key)),
    ...project.ai_features.filter((key) => key !== "none").map((key) => tagLabel(catalog.ai_features, key)),
    ...project.flows.map((key) => tagLabel(catalog.flows, key)),
    ...project.business_model.map((key) => tagLabel(catalog.business_model, key)),
    ...project.services.map((key) => tagLabel(catalog.services, key)),
  ];
  return [...new Set(labels)].filter((label) => new RegExp(`(^|\\W)${escapeRegExp(label)}(\\W|$)`, "i").test(query));
}

async function vectorCandidates(query: string, filters: SearchFilters): Promise<Map<string, { rank: number; passage: string }>> {
  const [vector] = await embed([query], "query");
  if (!vector) return new Map();
  const best = new Map<string, { score: number; passage: string }>();
  for (const match of await findSimilarChunks(vector, VECTOR_CHUNKS)) {
    if (!best.has(match.projectId)) best.set(match.projectId, { score: match.score, passage: match.text });
  }
  const visible = new Set((await findVisibleProjectsByIds([...best.keys()], filters)).map((project) => project.id));
  const ranked = [...best.entries()].filter(([id]) => visible.has(id)).sort(([, a], [, b]) => b.score - a.score);
  return new Map(ranked.map(([id, { passage }], rank) => [id, { rank, passage: passage.slice(0, PASSAGE_CHARS) }]));
}

/**
 * The SPEC's search_projects: keyword and meaning-based matches fused, then
 * reranked by Voyage, top 5. Without Voyage it falls back to keywords alone.
 */
export async function searchProjects(query: string, filters: SearchFilters = {}): Promise<ProjectSearchResult[]> {
  const { candidates: limit, topK } = AI_CONFIG.search;
  const voyage = Boolean(getAiConfig().voyageApiKey);
  const catalog = await getTagCatalog();

  const keywordMatches = await findProjectsByKeywords(query, filters, limit);
  const vectorRanks = voyage ? await vectorCandidates(query, filters) : new Map<string, { rank: number; passage: string }>();

  const byId = new Map<string, Candidate>();
  keywordMatches.forEach(({ project }, rank) => byId.set(project.id, { project, fused: 1 / (RRF_K + rank), keyword: true }));
  if (vectorRanks.size > 0) {
    const missing = [...vectorRanks.keys()].filter((id) => !byId.has(id));
    const projects = new Map((await findVisibleProjectsByIds(missing, filters)).map((project) => [project.id, project]));
    for (const [id, { rank, passage }] of vectorRanks) {
      const existing = byId.get(id);
      const project = existing?.project ?? projects.get(id);
      if (!project) continue;
      byId.set(id, { project, fused: (existing?.fused ?? 0) + 1 / (RRF_K + rank), keyword: existing?.keyword ?? false, passage });
    }
  }

  const pool = [...byId.values()].sort((a, b) => b.fused - a.fused).slice(0, limit);
  const toResult = (candidate: Candidate, score: number): ProjectSearchResult => ({
    project: candidate.project,
    score,
    why: { tags: namedTags(candidate.project, query, catalog), passage: candidate.passage, keyword: candidate.keyword },
  });

  if (!voyage || pool.length === 0) {
    const top = pool[0]?.fused ?? 1;
    return pool.slice(0, topK).map((candidate) => toResult(candidate, Number((candidate.fused / top).toFixed(3))));
  }

  try {
    const documents = pool.map((candidate) => {
      const [profile] = buildProjectChunks(candidate.project, catalog, AI_CONFIG.chunks.maxChars);
      return [profile?.text, candidate.passage].filter(Boolean).join("\n");
    });
    const ranked = await rerank(query, documents, topK);
    return ranked.flatMap(({ index, score }) => {
      const candidate = pool[index];
      return candidate ? [toResult(candidate, Number(score.toFixed(3)))] : [];
    });
  } catch (error) {
    // The fused order is a decent answer on its own; a reranker outage shouldn't fail the search.
    log.warn("rerank failed; using fused ranking", { error });
    const top = pool[0]?.fused ?? 1;
    return pool.slice(0, topK).map((candidate) => toResult(candidate, Number((candidate.fused / top).toFixed(3))));
  }
}
