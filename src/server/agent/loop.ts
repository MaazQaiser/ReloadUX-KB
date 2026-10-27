import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { TagCatalog } from "@/lib/tag-catalog";
import type { User } from "@/schemas/user";
import { AI_CONFIG } from "@/server/ai/config";
import { checkAnswer, SUBMIT_ANSWER_TOOL, submittedAnswerSchema, type SubmittedAnswer } from "./answer";
import { SYSTEM_PROMPT } from "./prompts/system-v1";
import { AGENT_TOOLS, runTool, toToolDefinition } from "./tools";

export interface HistoryTurn {
  question: string;
  answer: string;
}

export type AgentEvent =
  | { type: "status"; label: string }
  | { type: "final"; answer: SubmittedAnswer; toolsCalled: string[]; usage: { input: number; output: number } };

export type AgentFailure = "refused" | "truncated" | "no_answer" | "timeout";

/** An expected way for a turn to end without an answer; the service turns it into a friendly message. */
export class AgentError extends Error {
  constructor(readonly kind: AgentFailure) {
    super(`agent turn ended: ${kind}`);
    this.name = "AgentError";
  }
}

export interface AgentInput {
  client: Anthropic;
  question: string;
  history: readonly HistoryTurn[];
  user: User;
  turnId: string;
  catalog: TagCatalog;
  /** Projects in the library, for the fact guard's name check. */
  library: readonly { slug: string; name: string }[];
  signal?: AbortSignal;
}

// Tools and system prompt never change between requests, so they form one cached prefix.
const TOOLS: Anthropic.Beta.BetaToolUnion[] = [...AGENT_TOOLS, SUBMIT_ANSWER_TOOL].map(toToolDefinition);
const SYSTEM: Anthropic.Beta.BetaTextBlockParam[] = [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }];
// The model gets this many chances to fix an answer the guard rejected, and to remember submit_answer.
const MAX_CORRECTIONS = 2;
const STATUS_TEXT_LIMIT = 60;

const projectInput = z.object({ project: z.string() });

function statusFor(call: Anthropic.Beta.BetaToolUseBlock): string {
  switch (call.name) {
    case "get_verified_answer":
      return "Checking approved answers";
    case "search_projects":
      return "Searching projects";
    case "get_project":
    {
      const parsed = projectInput.safeParse(call.input);
      return parsed.success ? `Opening ${parsed.data.project.slice(0, STATUS_TEXT_LIMIT)}` : "Opening a project";
    }
    case "list_projects":
      return "Listing projects";
    case "find_visuals":
      return "Finding screens";
    case "log_gap":
      return "Noting a gap for review";
    default:
      return "Working";
  }
}

/** Why a submit_answer call can't be accepted yet; empty when it can. */
function submitProblems(
  parsed: ReturnType<typeof submittedAnswerSchema.safeParse>,
  alongsideOtherTools: boolean,
  revealed: ReadonlySet<string>,
  library: AgentInput["library"],
): string[] {
  if (!parsed.success) return parsed.error.issues.map((issue) => `${issue.path.join(".") || "answer"}: ${issue.message}`);
  // Results of tools called in the same breath haven't been seen yet, so the answer can't rest on them.
  if (alongsideOtherTools) return ["Call submit_answer on its own, after the other tools' results are back."];
  const guard = checkAnswer(parsed.data, revealed, library);
  return guard.ok ? [] : guard.problems;
}

function historyMessages(history: readonly HistoryTurn[]): Anthropic.Beta.BetaMessageParam[] {
  return history.slice(-AI_CONFIG.agent.historyTurns).flatMap((turn): Anthropic.Beta.BetaMessageParam[] => [
    { role: "user", content: turn.question },
    { role: "assistant", content: turn.answer },
  ]);
}

/**
 * One question, answered with tools. Yields a status line per tool call, then
 * the final, guard-checked answer. The conversation is append-only (each
 * response goes back unchanged), which keeps thinking blocks and the cache valid.
 */
export async function* runAgent(input: AgentInput): AsyncGenerator<AgentEvent> {
  const { client, question, history, user, turnId, catalog, library } = input;
  const { model, maxTokens, effort, maxToolCalls, timeoutMs, fallbackBeta } = AI_CONFIG.agent;
  const signal = AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(input.signal ? [input.signal] : [])]);
  const messages: Anthropic.Beta.BetaMessageParam[] = [...historyMessages(history), { role: "user", content: question }];
  const revealed = new Set<string>();
  const toolsCalled: string[] = [];
  const usage = { input: 0, output: 0 };
  let corrections = 0;

  for (;;) {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create(
        {
          model,
          max_tokens: maxTokens,
          betas: [fallbackBeta],
          fallbacks: "default",
          output_config: { effort },
          system: SYSTEM,
          tools: TOOLS,
          messages,
        },
        { signal },
      );
    } catch (error) {
      if (signal.aborted && !input.signal?.aborted) throw new AgentError("timeout");
      throw error;
    }
    usage.input += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0);
    usage.output += response.usage.output_tokens;

    if (response.stop_reason === "refusal") throw new AgentError("refused");
    if (response.stop_reason === "max_tokens") throw new AgentError("truncated");
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "pause_turn") continue;

    const calls = response.content.filter((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use");
    if (calls.length === 0) {
      // auto tool choice can't force submit_answer, so remind once or twice before giving up.
      if (corrections++ >= MAX_CORRECTIONS) throw new AgentError("no_answer");
      messages.push({ role: "user", content: "Finish by calling submit_answer with your answer." });
      continue;
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    const work = calls.filter((call) => call.name !== SUBMIT_ANSWER_TOOL.name);
    const submit = calls.find((call) => call.name === SUBMIT_ANSWER_TOOL.name);

    if (work.length > 0) {
      for (const call of work) yield { type: "status", label: statusFor(call) };
      const outcomes = await Promise.all(
        work.map(async (call) => {
          if (toolsCalled.length >= maxToolCalls) {
            return { call, run: { ok: false as const, error: "Tool limit reached for this question. Call submit_answer now with what you have." } };
          }
          toolsCalled.push(call.name);
          return { call, run: await runTool(call.name, call.input, { user, turnId, question, catalog }) };
        }),
      );
      for (const { call, run } of outcomes) {
        if (run.ok) run.output.projectSlugs.forEach((slug) => revealed.add(slug));
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: run.ok ? JSON.stringify(run.output.content) : run.error,
          ...(!run.ok && { is_error: true }),
        });
      }
    }

    if (submit) {
      const parsed = submittedAnswerSchema.safeParse(submit.input);
      const problems = submitProblems(parsed, work.length > 0, revealed, library);
      if (parsed.success && problems.length === 0) {
        yield { type: "final", answer: parsed.data, toolsCalled, usage };
        return;
      }
      if (corrections++ >= MAX_CORRECTIONS) throw new AgentError("no_answer");
      results.push({ type: "tool_result", tool_use_id: submit.id, content: `Not accepted. ${problems.join(" ")}`, is_error: true });
    }

    messages.push({ role: "user", content: results });
  }
}
