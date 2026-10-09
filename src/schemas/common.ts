import { z } from "zod";

/** Matches what toSlug() produces: lowercase words joined by single hyphens. */
export const slugSchema = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be lowercase letters and digits joined by hyphens");

/**
 * Domain records use string ids; repositories convert to and from ObjectId,
 * so these schemas stay safe to import in client components.
 */
export const idSchema = z.string().regex(/^[a-f0-9]{24}$/, "must be a 24-character hex id");

/** Who made a change: a user id, or `system:<script>` for scripts such as the seed. */
export const actorSchema = z.string().regex(/^([a-f0-9]{24}|system:[a-z0-9-]+)$/, "must be a user id or system:<name>");

export const shortTextSchema = z.string().trim().min(1).max(200);
export const longTextSchema = z.string().trim().min(1).max(20_000);

// Only http(s): links are rendered as anchors, and javascript: or data: URLs would be an XSS risk.
export const httpUrlSchema = z.url({ protocol: /^https?$/, hostname: z.regexes.domain });

export const linkSchema = z.object({
  label: shortTextSchema,
  url: httpUrlSchema,
});

export const milestoneSchema = z.object({
  name: shortTextSchema,
  date: z.date(),
});

export const metricSchema = z.object({
  label: shortTextSchema,
  // Text, not a number: metrics read like "40%", "2x" or "3 weeks".
  value: shortTextSchema,
});

/** A list with no repeated values; repeats almost always mean a bad import or LLM output. */
export function uniqueList<T extends z.ZodType<string>>(item: T) {
  return z.array(item).refine((values) => new Set(values).size === values.length, "must not repeat values");
}

export type Link = z.infer<typeof linkSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Metric = z.infer<typeof metricSchema>;
