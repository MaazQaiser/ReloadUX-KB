import { z } from "zod";
import { idSchema } from "./common";

/** Why a question needs a human (SPEC.md learning loop, step 2). */
export const GAP_REASONS = ["thumbs_down", "not_recorded", "low_confidence_no", "rephrased"] as const;
/** How an admin closed it (step 3). */
export const GAP_RESOLUTIONS = ["fixed_record", "added_project", "added_tag", "verified_answer", "dismissed"] as const;

export const gapResolutionSchema = z.enum(GAP_RESOLUTIONS);

export const knowledgeGapSchema = z.object({
  id: idSchema,
  question: z.string(),
  reason: z.enum(GAP_REASONS),
  note: z.string().optional(),
  turn_id: z.uuid().optional(),
  user_id: idSchema,
  status: z.enum(["open", "resolved"]),
  resolution: z
    .object({ type: gapResolutionSchema, note: z.string().optional(), by: idSchema, at: z.date() })
    .optional(),
  created_at: z.date(),
});

export type KnowledgeGap = z.infer<typeof knowledgeGapSchema>;
export type GapResolution = z.infer<typeof gapResolutionSchema>;
