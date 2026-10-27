import { z } from "zod";
import { idSchema } from "./common";
import { aiFeatureSchema, businessModelSchema, flowSchema, industrySchema, productTypeSchema } from "./tags";

export const PROJECT_SORTS = ["newest", "least_complete"] as const;
export const PROJECT_VIEWS = ["grid", "list"] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

/** Keys that change how results are shown, not which projects match. */
const PRESENTATION_KEYS = new Set(["sort", "view"]);

/**
 * Filters for the Projects grid. Values arrive as URL search params, so
 * numbers are coerced. `q` is a case-insensitive match on name and client.
 */
export const projectFiltersSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  industry: industrySchema.optional(),
  product_type: productTypeSchema.optional(),
  ai_feature: aiFeatureSchema.optional(),
  flow: flowSchema.optional(),
  business_model: businessModelSchema.optional(),
  /** A person id; matches lead designer or any designer. */
  designer: idSchema.optional(),
  /** Delivery year, in UTC. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  /** Kept with the filters so it survives in the URL like them; unset means newest delivery first. */
  sort: z.enum(PROJECT_SORTS).optional(),
  /** Grid or list layout, kept in the URL for the same reason as sort; unset means grid. */
  view: z.enum(PROJECT_VIEWS).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ParsedProjectSearch {
  filters: ProjectFilters;
  pagination: Pagination;
  /** Param names that were present but invalid, so the page can say they were ignored. */
  ignored: string[];
}

/**
 * Reads grid filters from URL params one field at a time: a bad value (an old
 * bookmark, a hand-edited URL) drops that filter instead of failing the page.
 */
export function parseProjectSearch(raw: RawSearchParams): ParsedProjectSearch {
  const first = (key: string) => {
    const value = raw[key];
    const single = Array.isArray(value) ? value[0] : value;
    return single === "" ? undefined : single;
  };
  const ignored: string[] = [];

  const filters: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(projectFiltersSchema.shape)) {
    const value = first(key);
    if (value === undefined) continue;
    const result = schema.safeParse(value);
    if (result.success) filters[key] = result.data;
    else ignored.push(key);
  }

  const paginationResult = paginationSchema.safeParse({ page: first("page") });
  if (!paginationResult.success) ignored.push("page");

  return {
    filters: projectFiltersSchema.parse(filters),
    pagination: paginationResult.success ? paginationResult.data : paginationSchema.parse({}),
    ignored,
  };
}

/** Builds a grid URL for the given filters and page, leaving out empty values. */
export function projectSearchHref(filters: ProjectFilters, page = 1): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

/** True when something narrows the results; sort and view only change how they're shown. */
export function hasActiveFilters(filters: ProjectFilters): boolean {
  return Object.entries(filters).some(([key, value]) => value !== undefined && !PRESENTATION_KEYS.has(key));
}
