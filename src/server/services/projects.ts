import "server-only";
import { getCompleteness, type Completeness } from "@/lib/completeness";
import { buildSearchText } from "@/lib/search-text";
import { getTagCatalog, unknownTags } from "@/server/services/tags";
import { err, ok, toValidationIssues, type Result, type ValidationIssue } from "@/lib/result";
import type { Actor } from "@/schemas/common";
import type { Person } from "@/schemas/person";
import { projectInputSchema, type Project, type ProjectFields, type ProjectInput } from "@/schemas/project";
import type { Pagination, ProjectFilters } from "@/schemas/project-filters";
import type { ReviewStatus } from "@/schemas/tags";
import { findPeopleByIds, listPeople } from "@/server/repositories/people";
import {
  findProjectBySlug,
  insertProject,
  listAllVisibleProjects,
  listDeliveryYears,
  listProjects,
  updateProjectById,
  upsertProjectBySlug,
} from "@/server/repositories/projects";

export type SaveProjectError =
  | { kind: "invalid"; issues: ValidationIssue[] }
  | { kind: "unknown_people"; ids: string[] };

interface PreparedProject {
  fields: ProjectFields;
  searchText: string;
}

/**
 * Validation, the people check and search_text: the steps every save shares,
 * whichever entry point (form, admin chat, import, seed) it comes from.
 * Chunks and embeddings join here in phase 2e.
 */
async function prepareProject(input: ProjectInput): Promise<Result<PreparedProject, SaveProjectError>> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return err({ kind: "invalid", issues: toValidationIssues(parsed.error) });

  const { lead_designer, designers, account_manager } = parsed.data;
  const referenced = [...new Set([lead_designer, ...designers, ...(account_manager ? [account_manager] : [])])];
  const catalog = await getTagCatalog();
  const unknownTagValues = unknownTags(catalog, {
    industry: [parsed.data.industry],
    product_types: parsed.data.product_types,
    services: parsed.data.services,
    ai_features: parsed.data.ai_features,
    flows: parsed.data.flows,
  });
  const tagIssues = Object.entries(unknownTagValues).map(([list, keys]) => ({ path: list, message: `not a known value: ${keys.join(", ")}` }));
  if (tagIssues.length > 0) return err({ kind: "invalid", issues: tagIssues });

  const people = await findPeopleByIds(referenced);
  const found = new Set(people.map((person) => person.id));
  const unknown = referenced.filter((id) => !found.has(id));
  if (unknown.length > 0) return err({ kind: "unknown_people", ids: unknown });

  return ok({ fields: parsed.data, searchText: buildSearchText(parsed.data, people.map((person) => person.name), catalog) });
}

/** Create-or-update by slug, for seeds and imports that must be safe to re-run. */
export async function saveProject(
  input: ProjectInput,
  options: { actor: Actor; reviewStatus: ReviewStatus },
): Promise<Result<Project, SaveProjectError>> {
  const prepared = await prepareProject(input);
  if (!prepared.ok) return prepared;
  return ok(await upsertProjectBySlug(prepared.value.fields, { ...options, searchText: prepared.value.searchText }));
}

export type CreateProjectError = SaveProjectError | { kind: "slug_taken"; slug: string };

/** A new project from the form. An editor saving it is the approval, so it goes live. */
export async function createProject(input: ProjectInput, actor: Actor): Promise<Result<Project, CreateProjectError>> {
  const prepared = await prepareProject(input);
  if (!prepared.ok) return prepared;

  const { fields, searchText } = prepared.value;
  const created = await insertProject(fields, { actor, reviewStatus: "approved", searchText });
  return created ? ok(created) : err({ kind: "slug_taken", slug: fields.slug });
}

export type UpdateProjectError = SaveProjectError | { kind: "not_found" };

/** Saves an edit. The slug is kept from the stored record whatever the input says. */
export async function updateProject(
  id: string,
  input: Omit<ProjectInput, "slug">,
  { actor, slug }: { actor: Actor; slug: string },
): Promise<Result<Project, UpdateProjectError>> {
  const prepared = await prepareProject({ ...input, slug });
  if (!prepared.ok) return prepared;

  const { fields, searchText } = prepared.value;
  const updated = await updateProjectById(id, fields, { actor, reviewStatus: "approved", searchText });
  return updated ? ok(updated) : err({ kind: "not_found" });
}

/** A project for the edit form, drafts included. */
export async function getProjectForEdit(slug: string): Promise<Project | null> {
  return findProjectBySlug(slug, { includeDrafts: true });
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

/** Name and slug of every live project, for pickers such as verified answers. */
export async function listProjectOptions(): Promise<{ slug: string; name: string }[]> {
  return (await listAllVisibleProjects())
    .map(({ slug, name }) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
