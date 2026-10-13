import { z } from "zod";
import { idSchema, slugSchema } from "./common";
import { answerVerdictSchema } from "./answer";

/** One Ask turn, logged for analytics and the learning loop (SPEC.md: conversations). */
export const conversationSchema = z.object({
  id: idSchema,
  turn_id: z.uuid(),
  user_id: idSchema,
  question: z.string(),
  verdict: answerVerdictSchema.nullable(),
  project_slugs: z.array(slugSchema),
  tools_called: z.array(z.string()),
  latency_ms: z.number().int().nonnegative(),
  // Filled in once the agent reports usage; preview answers have none.
  input_tokens: z.number().int().nonnegative().optional(),
  output_tokens: z.number().int().nonnegative().optional(),
  // A canned preview answer, not the agent: kept out of answer-quality stats.
  preview: z.boolean(),
  feedback: z
    .object({ rating: z.enum(["up", "down"]), note: z.string().optional(), at: z.date() })
    .optional(),
  created_at: z.date(),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type NewConversation = Omit<Conversation, "id" | "feedback">;
