import "server-only";
import type { AnswerFeedback, AnswerProject, AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { PREVIEW_ANSWERS, PREVIEW_FALLBACK } from "@/server/fixtures/answers";
import { logger } from "@/server/logger";
import { insertConversation, setConversationFeedback } from "@/server/repositories/conversations";
import { insertGap } from "@/server/repositories/knowledge-gaps";
import { getClaude } from "@/server/ai/claude";
import type { HistoryTurn } from "@/server/agent/loop";
import { streamAgentAnswer, toDeltas } from "@/server/services/agent-answer";
import { getCoverUrls } from "@/server/services/visuals";

const log = logger.child({ module: "ask" });

export interface StreamOptions {
  /** Pause between streamed words, so the preview feels like the real agent. Tests pass 0. */
  delayMs?: number;
  signal?: AbortSignal;
  /** Earlier turns of the conversation, for follow-up questions. */
  history?: readonly HistoryTurn[];
}

const PREVIEW_DELAY_MS = 30;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { toDeltas };

function pickPreviewAnswer(question: string) {
  const lower = question.toLowerCase();
  return PREVIEW_ANSWERS.find((answer) => answer.keywords.every((keyword) => lower.includes(keyword))) ?? PREVIEW_FALLBACK;
}

/** Adds each card's cover screenshot. A failed lookup costs the thumbnails, never the answer. */
async function withCovers(projects: AnswerProject[], turnId: string): Promise<AnswerProject[]> {
  try {
    const covers = await getCoverUrls(projects.map((project) => project.slug));
    return projects.map((project) => {
      const cover = covers.get(project.slug);
      return cover ? { ...project, cover_url: cover } : project;
    });
  } catch (error) {
    log.warn("cover lookup failed; answering without thumbnails", { turnId, error });
    return projects;
  }
}

/**
 * Answers one question as a stream of events: by the agent when Claude is
 * connected, otherwise by replaying canned preview answers (development
 * without keys, e2e). Both emit the same events.
 */
export async function* streamAnswer(
  question: string,
  user: User,
  { delayMs = PREVIEW_DELAY_MS, signal, history = [] }: StreamOptions = {},
): AsyncGenerator<AskEvent> {
  const claude = getClaude();
  if (claude) {
    yield* streamAgentAnswer(claude, question, history, user, signal);
    return;
  }

  const turnId = crypto.randomUUID();
  const startedAt = Date.now();
  log.info("ask turn started", { turnId, userId: user.id, preview: true });

  yield { type: "status", label: "Searching projects" };
  await pause(delayMs * 10);

  const answer = pickPreviewAnswer(question);
  const projects = await withCovers(answer.projects, turnId);
  yield { type: "answer", verdict: answer.verdict, projects, records: answer.records };

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
