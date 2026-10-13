import "server-only";
import type { AnswerFeedback, AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { PREVIEW_ANSWERS, PREVIEW_FALLBACK } from "@/server/fixtures/answers";
import { logger } from "@/server/logger";
import { insertConversation, setConversationFeedback } from "@/server/repositories/conversations";
import { insertGap } from "@/server/repositories/knowledge-gaps";

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
  const startedAt = Date.now();
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
  // Logged before "done" so feedback on this turn always finds it.
  await insertConversation({
    turn_id: turnId,
    user_id: user.id,
    question,
    verdict: answer.verdict,
    project_slugs: answer.projects.map((project) => project.slug),
    tools_called: [],
    latency_ms: Date.now() - startedAt,
    preview: true,
    created_at: new Date(startedAt),
  });
  yield { type: "done", turn_id: turnId, preview: true };
}

/**
 * Thumbs up/down on the asker's own answer. A thumbs down on a real (not
 * preview) answer becomes a knowledge gap for the review queue.
 * Returns false when the turn isn't theirs or doesn't exist.
 */
export async function recordAnswerFeedback(feedback: AnswerFeedback, user: User): Promise<boolean> {
  const turn = await setConversationFeedback(feedback.turn_id, user.id, { rating: feedback.rating, note: feedback.note });
  log.info("answer feedback", { turnId: feedback.turn_id, userId: user.id, rating: feedback.rating, found: Boolean(turn) });
  if (!turn) return false;
  if (feedback.rating === "down" && !turn.preview) {
    await insertGap({ question: turn.question, reason: "thumbs_down", note: feedback.note, turn_id: turn.turn_id, user_id: user.id });
  }
  return true;
}
