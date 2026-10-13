import { z } from "zod";
import { ANSWER_VERDICT, MAX_FEEDBACK_NOTE_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/constants";
import { linkSchema, shortTextSchema, slugSchema } from "./common";
import { industrySchema, productTypeSchema } from "./tags";

export const answerVerdictSchema = z.enum(ANSWER_VERDICT.keys);

export const askRequestSchema = z.object({
  question: z.string().trim().min(1, "Type a question first.").max(MAX_QUESTION_LENGTH),
});

/** A project card in an answer: enough to judge the match without opening the record. */
export const answerProjectSchema = z.object({
  slug: slugSchema,
  name: shortTextSchema,
  industry: industrySchema,
  product_types: z.array(productTypeSchema),
  why: shortTextSchema,
  links: z.array(linkSchema),
});

/** A record the answer drew on, listed so people can click through and verify (answer rule 5). */
export const answerRecordSchema = z.object({
  slug: slugSchema,
  name: shortTextSchema,
});

/**
 * One line of the /api/ask NDJSON stream. The verdict and cards arrive before
 * the prose, so the answer opens with them the way the answer rules require.
 */
export const askEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("status"), label: shortTextSchema }),
  z.object({
    type: z.literal("answer"),
    verdict: answerVerdictSchema.nullable(),
    projects: z.array(answerProjectSchema),
    records: z.array(answerRecordSchema),
  }),
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({ type: z.literal("done"), turn_id: z.uuid(), preview: z.boolean() }),
  z.object({ type: z.literal("error"), message: shortTextSchema }),
]);

export const answerFeedbackSchema = z.object({
  turn_id: z.uuid(),
  rating: z.enum(["up", "down"]),
  note: z.string().trim().max(MAX_FEEDBACK_NOTE_LENGTH).optional(),
});

export type AnswerVerdict = z.infer<typeof answerVerdictSchema>;
export type AnswerProject = z.infer<typeof answerProjectSchema>;
export type AnswerRecord = z.infer<typeof answerRecordSchema>;
export type AskEvent = z.infer<typeof askEventSchema>;
export type AnswerFeedback = z.infer<typeof answerFeedbackSchema>;
