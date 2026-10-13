import "server-only";
import type { AnswerFeedback, AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { PREVIEW_ANSWERS, PREVIEW_FALLBACK } from "@/server/fixtures/answers";
import { logger } from "@/server/logger";

const log = logger.child({ module: "ask" });

export interface StreamOptions {
  /** Pause between streamed words, so the preview feels like the real agent. Tests pass 0. */
  delayMs?: number;
  signal?: AbortSignal;
}

const PREVIEW_DELAY_MS = 30;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Splits text into word-sized deltas, keeping the spaces, so joined deltas equal the text. */
export function toDeltas(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

function pickPreviewAnswer(question: string) {
  const lower = question.toLowerCase();
  return PREVIEW_ANSWERS.find((answer) => answer.keywords.every((keyword) => lower.includes(keyword))) ?? PREVIEW_FALLBACK;
}

/**
 * Answers one question as a stream of events. Until the agent lands in phase 3
 * this replays canned preview answers; the event shape is what the agent will emit.
 */
export async function* streamAnswer(
  question: string,
  user: User,
  { delayMs = PREVIEW_DELAY_MS, signal }: StreamOptions = {},
): AsyncGenerator<AskEvent> {
  const turnId = crypto.randomUUID();
  log.info("ask turn started", { turnId, userId: user.id, preview: true });

  yield { type: "status", label: "Searching projects" };
  await pause(delayMs * 10);

  const answer = pickPreviewAnswer(question);
  yield { type: "answer", verdict: answer.verdict, projects: answer.projects, records: answer.records };

  for (const delta of toDeltas(answer.text)) {
    if (signal?.aborted) return;
    yield { type: "text", delta };
    await pause(delayMs);
  }
  yield { type: "done", turn_id: turnId, preview: true };
}

/** Thumbs up/down on an answer. Stored on the conversation once `conversations` exists (phase 3). */
export async function recordAnswerFeedback(feedback: AnswerFeedback, user: User): Promise<void> {
  log.info("answer feedback", { turnId: feedback.turn_id, userId: user.id, rating: feedback.rating, hasNote: Boolean(feedback.note) });
}
