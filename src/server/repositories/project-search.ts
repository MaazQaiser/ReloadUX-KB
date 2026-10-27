import "server-only";
import { and, desc, inArray, sql } from "drizzle-orm";
import type { Project } from "@/schemas/project";
import type { ProjectFilters } from "@/schemas/project-filters";
import { getDb } from "@/server/db/client";
import { projects } from "@/server/db/schema";
import { projectColumns, toCondition, toProject } from "./projects";

/** The tag filters search accepts; free text goes in the query, not here. */
export type SearchFilters = Pick<ProjectFilters, "industry" | "product_type" | "ai_feature" | "flow" | "business_model">;

export interface KeywordMatch {
  project: Project;
  score: number;
}

/**
 * Any of the query's words, as a tsquery. Words are reduced to letters and
 * digits, so nothing in the question can break the tsquery syntax.
 */
function anyWord(query: string): string | null {
  const words = query.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.length > 0 ? words.join(" | ") : null;
}

/**
 * Visible projects whose name, client or search text contain any of the
 * query's words (Postgres full-text search: stemmed, stop words ignored),
 * best first. Names weigh most, then the client, then the rest.
 */
export async function findProjectsByKeywords(query: string, filters: SearchFilters, limit: number): Promise<KeywordMatch[]> {
  const words = anyWord(query);
  if (!words) return [];
  const tsquery = sql`to_tsquery('english', ${words})`;
  const score = sql<number>`ts_rank(${projects.search_document}, ${tsquery})`.mapWith(Number);
  const rows = await (await getDb())
    .select({ ...projectColumns, score })
    .from(projects)
    .where(and(toCondition(filters), sql`${projects.search_document} @@ ${tsquery}`))
    .orderBy(desc(score))
    .limit(limit);
  return rows.map(({ score: rank, ...row }) => ({ project: toProject(row), score: rank }));
}

/** Visible projects among the ids that also match the filters, in no particular order. */
export async function findVisibleProjectsByIds(ids: readonly string[], filters: SearchFilters): Promise<Project[]> {
  if (ids.length === 0) return [];
  const rows = await (await getDb()).select(projectColumns).from(projects).where(and(toCondition(filters), inArray(projects.id, [...ids])));
  return rows.map(toProject);
}
