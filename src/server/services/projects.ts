import "server-only";
import { getCompleteness, type Completeness } from "@/lib/completeness";
import { err, ok, toValidationIssues, type Result, type ValidationIssue } from "@/lib/result";
import type { Actor } from "@/schemas/common";
import type { Person } from "@/schemas/person";
import { projectInputSchema, type Project, type ProjectInput } from "@/schemas/project";
import type { Pagination, ProjectFilters } from "@/schemas/project-filters";
import type { ReviewStatus } from "@/schemas/tags";
import { findPeopleByIds, listPeople } from "@/server/repositories/people";
import {
  findProjectBySlug,
  listDeliveryYears,
  listProjects,
  upsertProjectBySlug,
} from "@/server/repositories/projects";

export type SaveProjectError =
  | { kind: "invalid"; issues: ValidationIssue[] }
  | { kind: "unknown_people"; ids: string[] };

/**
 * The one path for saving a project. Phase 2 adds search_text, chunks and
 * embeddings here, so every entry point (form, admin chat, import) gets them.
 */
export async function saveProject(
  input: ProjectInput,
  options: { actor: Actor; reviewStatus: ReviewStatus },
): Promise<Result<Project, SaveProjectError>> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "invalid", issues: toValidationIssues(parsed.error) });

  const { lead_designer, designers, account_manager } = parsed.data;
  const referenced = [...new Set([lead_designer, ...designers, ...(account_manager ? [account_manager] : [])])];
  const found = new Set((await findPeopleByIds(referenced)).map((person) => person.id));
  const unknown = referenced.filter((id) => !found.has(id));
  if (unknown.length > 0) return err({ kind: "unknown_people", ids: unknown });

  return ok(await upsertProjectBySlug(parsed.data, options));
}

export interface ProjectPeople {
  /** null when the referenced person no longer exists: show "not recorded". */
  lead_designer: Person | null;
  designers: Person[];
  account_manager: Person | null;
}

export interface ProjectDetail {
  project: Project;
  people: ProjectPeople;
  completeness: Completeness;
}

export async function getProjectDetail(slug: string): Promise<ProjectDetail | null> {
  const project = await findProjectBySlug(slug);
  if (!project) return null;

  const ids = [project.lead_designer, ...project.designers, ...(project.account_manager ? [project.account_manager] : [])];
  const byId = new Map((await findPeopleByIds([...new Set(ids)])).map((person) => [person.id, person]));

  return {
    project,
    people: {
      lead_designer: byId.get(project.lead_designer) ?? null,
      designers: project.designers.flatMap((id) => byId.get(id) ?? []),
      account_manager: (project.account_manager && byId.get(project.account_manager)) || null,
    },
    completeness: getCompleteness(project),
  };
}

export interface ProjectGridItem {
  project: Project;
  leadDesigner: Person | null;
}

export interface ProjectGridPage {
  items: ProjectGridItem[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listProjectsForGrid(filters: ProjectFilters, pagination: Pagination): Promise<ProjectGridPage> {
  const { items, total } = await listProjects(filters, pagination);
  const leads = await findPeopleByIds([...new Set(items.map((item) => item.lead_designer))]);
  const byId = new Map(leads.map((person) => [person.id, person]));

  return {
    items: items.map((project) => ({ project, leadDesigner: byId.get(project.lead_designer) ?? null })),
    total,
    page: pagination.page,
    pageCount: Math.max(1, Math.ceil(total / pagination.page_size)),
  };
}

export interface GridFilterOptions {
  /** Includes inactive designers: past projects should stay findable by who led them. */
  designers: Person[];
  years: number[];
}

export async function getGridFilterOptions(): Promise<GridFilterOptions> {
  const [designers, years] = await Promise.all([listPeople({ role: "designer" }), listDeliveryYears()]);
  return { designers, years };
}
