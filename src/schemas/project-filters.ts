import { z } from "zod";
import { idSchema } from "./common";
import { aiFeatureSchema, flowSchema, industrySchema, productTypeSchema } from "./tags";

/**
 * Filters for the Projects grid. Values arrive as URL search params, so
 * numbers are coerced. Until Atlas Search lands in phase 2, `q` is a
 * case-insensitive match on name and client.
 */
export const projectFiltersSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  industry: industrySchema.optional(),
  product_type: productTypeSchema.optional(),
  ai_feature: aiFeatureSchema.optional(),
  flow: flowSchema.optional(),
  /** A person id; matches lead designer or any designer. */
  designer: idSchema.optional(),
  /** Delivery year, in UTC. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
