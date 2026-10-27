import "server-only";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import type { Project } from "@/schemas/project";
import type { ProjectFilters } from "@/schemas/project-filters";
import { logger } from "@/server/logger";
import { toObjectId } from "./mongo";
import { projectsCollection, toProject, toQuery } from "./projects";

const log = logger.child({ module: "project-search" });

/** The tag filters search accepts; free text goes in the query, not here. */
export type SearchFilters = Pick<ProjectFilters, "industry" | "product_type" | "ai_feature" | "flow" | "business_model">;

export interface KeywordMatch {
  project: Project;
  score: number;
}

const INDEX_NOT_FOUND = 27;
const scoreSchema = z.object({ score: z.number() });

/**
 * Visible projects whose name, client or search text contain the query's
 * words (MongoDB text search: stemmed, stop words ignored), best first.
 */
export async function findProjectsByKeywords(query: string, filters: SearchFilters, limit: number): Promise<KeywordMatch[]> {
  try {
    const documents = await (await projectsCollection())
      .find({ ...toQuery(filters), $text: { $search: query } }, { projection: { score: { $meta: "textScore" } } })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray();
    return documents.map(({ score, ...document }) => ({ project: toProject(document), score: scoreSchema.parse({ score }).score }));
  } catch (error) {
    // Before `pnpm db:indexes` creates the text index, keyword search has nothing to search.
    if (!(error instanceof MongoServerError && error.code === INDEX_NOT_FOUND)) throw error;
    log.warn("the projects text index is missing; run pnpm db:indexes. Keyword search returns nothing until then");
    return [];
  }
}

/** Visible projects among the ids that also match the filters, in no particular order. */
export async function findVisibleProjectsByIds(ids: readonly string[], filters: SearchFilters): Promise<Project[]> {
  if (ids.length === 0) return [];
  const documents = await (await projectsCollection())
    .find({ ...toQuery(filters), _id: { $in: ids.map(toObjectId) } })
    .toArray();
  return documents.map(toProject);
}
