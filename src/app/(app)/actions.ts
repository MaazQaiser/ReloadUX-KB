"use server";

import { answerFeedbackSchema } from "@/schemas/answer";
import { requireRole } from "@/server/auth";
import { recordAnswerFeedback } from "@/server/services/ask";

export type FeedbackActionResult = { ok: true } | { ok: false; message: string };

export async function submitAnswerFeedbackAction(raw: unknown): Promise<FeedbackActionResult> {
  const user = await requireRole("viewer");
  const feedback = answerFeedbackSchema.safeParse(raw);
  if (!feedback.success) return { ok: false, message: "That feedback couldn't be read. Try again." };

  await recordAnswerFeedback(feedback.data, user);
  return { ok: true };
}
