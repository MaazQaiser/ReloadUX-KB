"use server";

import { answerFeedbackSchema } from "@/schemas/answer";
import { slugSchema } from "@/schemas/common";
import { requireRole } from "@/server/auth";
import { recordAnswerFeedback } from "@/server/services/ask";
import { getProjectBrief, type ProjectBrief } from "@/server/services/project-brief";

export type FeedbackActionResult = { ok: true } | { ok: false; message: string };

export async function submitAnswerFeedbackAction(raw: unknown): Promise<FeedbackActionResult> {
  const user = await requireRole("viewer");
  const feedback = answerFeedbackSchema.safeParse(raw);
  if (!feedback.success) return { ok: false, message: "That feedback couldn't be read. Try again." };

  const saved = await recordAnswerFeedback(feedback.data, user);
  return saved ? { ok: true } : { ok: false, message: "That answer couldn't be found. Ask again and rate the new one." };
}

export type ProjectBriefActionResult = { ok: true; brief: ProjectBrief } | { ok: false; message: string };

/** The project panel on the Ask screen loads its details on demand, when a card is opened. */
export async function getProjectBriefAction(rawSlug: unknown): Promise<ProjectBriefActionResult> {
  await requireRole("viewer");
  const slug = slugSchema.safeParse(rawSlug);
  if (!slug.success) return { ok: false, message: "That project link isn't valid." };

  const brief = await getProjectBrief(slug.data);
  return brief ? { ok: true, brief } : { ok: false, message: "That project isn't in the library any more." };
}
