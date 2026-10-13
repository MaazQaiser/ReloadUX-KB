import { z } from "zod";
import { actorSchema, idSchema, slugSchema } from "./common";

/** What an admin writes: an approved answer the agent prefers for very similar questions. */
export const verifiedAnswerInputSchema = z.object({
  question: z.string().trim().min(5, "Write the question as people ask it.").max(1000),
  answer: z.string().trim().min(5, "Write the answer.").max(5000),
  project_slugs: z
    .array(slugSchema)
    .max(20)
    .refine((slugs) => new Set(slugs).size === slugs.length, "must not repeat projects"),
});

export const verifiedAnswerSchema = verifiedAnswerInputSchema.extend({
  id: idSchema,
  created_by: actorSchema,
  created_at: z.date(),
  updated_by: actorSchema,
  updated_at: z.date(),
  deleted_at: z.date().optional(),
});

export type VerifiedAnswerInput = z.input<typeof verifiedAnswerInputSchema>;
export type VerifiedAnswer = z.infer<typeof verifiedAnswerSchema>;
