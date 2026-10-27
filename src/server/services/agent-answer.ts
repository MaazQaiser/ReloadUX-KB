import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { buildAnswerCards, type SubmittedAnswer } from "@/server/agent/answer";
import { AgentError, runAgent, type AgentFailure, type HistoryTurn } from "@/server/agent/loop";
import { PROMPT_VERSION } from "@/server/agent/prompts/system-v1";
import { logger } from "@/server/logger";
import { insertConversation } from "@/server/repositories/conversations";
import { listProjectOptions } from "@/server/services/projects";
import { getTagCatalog } from "@/server/services/tags";

const log = logger.child({ module: "agent-answer" });

const FAILURE_MESSAGES: Record<AgentFailure, string> = {
  refused: "That question couldn't be answered. Try rephrasing it.",
  truncated: "The answer ran too long. Try a narrower question.",
  no_answer: "I couldn't put together an answer I could back up. Try rephrasing, or ask about one project at a time.",
  timeout: "That took too long to answer. Try a narrower question.",
};
const BUSY_MESSAGE = "The assistant is busy right now. Try again in a minute.";
const GENERIC_MESSAGE = "Something went wrong while answering. Try again in a moment.";

/** Splits text into word-sized deltas, keeping the spaces, so joined deltas equal the text. */
export function toDeltas(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

/**
 * One question answered by the agent, as the same event stream the preview
 * uses: status lines while tools run, then the verdict and cards, then the
 * text, then done. Every turn is logged, answered or not.
 */
export async function* streamAgentAnswer(
  client: Anthropic,
  question: string,
  history: readonly HistoryTurn[],
  user: User,
  signal?: AbortSignal,
): AsyncGenerator<AskEvent> {
  const turnId = crypto.randomUUID();
  const startedAt = Date.now();
  const [catalog, library] = await Promise.all([getTagCatalog(), listProjectOptions()]);
  let answer: SubmittedAnswer | null = null;
  let toolsCalled: string[] = [];
  let usage = { input: 0, output: 0 };
  let failure: string | null = null;

  yield { type: "status", label: "Reading the question" };
  try {
    for await (const event of runAgent({ client, question, history, user, turnId, catalog, library, signal })) {
      if (event.type === "status") yield { type: "status", label: event.label };
      else ({ answer, toolsCalled, usage } = event);
    }
  } catch (error) {
    if (signal?.aborted) return;
    if (error instanceof AgentError) failure = FAILURE_MESSAGES[error.kind];
    else if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) failure = BUSY_MESSAGE;
    else failure = GENERIC_MESSAGE;
    log.error("agent turn failed", { turnId, userId: user.id, kind: error instanceof AgentError ? error.kind : undefined, error });
  }

  const cards = answer ? await buildAnswerCards(answer) : { projects: [], records: [] };
  // Logged before the reply finishes so feedback on this turn always finds it.
  await insertConversation({
    turn_id: turnId,
    user_id: user.id,
    question,
    verdict: answer?.verdict ?? null,
    project_slugs: cards.projects.map((project) => project.slug),
    tools_called: toolsCalled,
    latency_ms: Date.now() - startedAt,
    input_tokens: usage.input,
    output_tokens: usage.output,
    preview: false,
    created_at: new Date(startedAt),
  });
  log.info("agent turn", { turnId, prompt: PROMPT_VERSION, tools: toolsCalled, projects: cards.records.length, ms: Date.now() - startedAt, ...usage });

  if (!answer || failure) {
    yield { type: "error", message: failure ?? GENERIC_MESSAGE };
    return;
  }
  yield { type: "answer", verdict: answer.verdict, projects: cards.projects, records: cards.records };
  for (const delta of toDeltas(answer.answer)) yield { type: "text", delta };
  yield { type: "done", turn_id: turnId, preview: false };
}
