import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builtInCatalog } from "@/lib/tag-catalog";
import type { User } from "@/schemas/user";
import { AI_CONFIG } from "@/server/ai/config";
import { AgentError, runAgent, type AgentEvent } from "./loop";

const tools = vi.hoisted(() => ({
  runTool: vi.fn(async (name: string) => ({
    ok: true as const,
    output: { content: { from: name }, projectSlugs: name === "search_projects" ? ["calmly-care"] : [] },
  })),
}));
vi.mock("./tools", () => ({
  AGENT_TOOLS: [],
  runTool: tools.runTool,
  toToolDefinition: (tool: { name: string; description: string }) => ({ name: tool.name, description: tool.description, input_schema: { type: "object" } }),
}));

type Block = Anthropic.Beta.BetaContentBlock;
let callId = 0;
const toolUse = (name: string, input: unknown): Block => ({ type: "tool_use", id: `toolu_${++callId}`, name, input }) as Block;
const text = (value: string): Block => ({ type: "text", text: value, citations: null }) as Block;
const reply = (content: Block[], stop_reason: Anthropic.Beta.BetaStopReason = "tool_use") =>
  ({ model: AI_CONFIG.agent.model, content, stop_reason, usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 } }) as Anthropic.Beta.BetaMessage;

const GOOD = { verdict: "yes", projects: [{ slug: "calmly-care", why: "Healthcare app with a symptom-check chatbot" }], answer: "Yes: Calmly Care." };
const library = [
  { slug: "calmly-care", name: "Calmly Care" },
  { slug: "ledgerly", name: "Ledgerly" },
];

/** A client that plays back replies and records each request as it was when sent (the loop keeps appending). */
function fakeClient(...replies: Anthropic.Beta.BetaMessage[]) {
  const requests: Anthropic.Beta.MessageCreateParams[] = [];
  const create = vi.fn(async (params: Anthropic.Beta.MessageCreateParams) => {
    requests.push(structuredClone(params));
    const next = replies.shift();
    if (!next) throw new Error("no more scripted replies");
    return next;
  });
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, requests };
}

async function collect(client: Anthropic, history: { question: string; answer: string }[] = []) {
  const events: AgentEvent[] = [];
  for await (const event of runAgent({
    client,
    question: "Have we done a healthcare chatbot?",
    history,
    user: { id: "64b7f0c2a1b2c3d4e5f60799" } as User,
    turnId: "4b0e9a0e-5f2d-4c61-9d64-0a1f3c2b7e11",
    catalog: builtInCatalog(),
    library,
  })) {
    events.push(event);
  }
  return events;
}

beforeEach(() => tools.runTool.mockClear());

describe("runAgent", () => {
  it("runs tools, reports status, and returns the checked answer with usage", async () => {
    const { client, requests } = fakeClient(
      reply([toolUse("search_projects", { query: "healthcare chatbot" })]),
      reply([toolUse("submit_answer", GOOD)]),
    );
    const events = await collect(client);

    expect(events[0]).toEqual({ type: "status", label: "Searching projects" });
    expect(events.at(-1)).toEqual({ type: "final", answer: GOOD, toolsCalled: ["search_projects"], usage: { input: 300, output: 40, models: [AI_CONFIG.agent.model] } });
    // The tool result went back to the model, and the request used the configured model and fallbacks.
    const second = requests[1]!;
    expect(second.model).toBe(AI_CONFIG.agent.model);
    expect(second.fallbacks).toBe("default");
    expect(JSON.stringify(second.messages.at(-1))).toContain('"from\\":\\"search_projects');
  });

  it("rejects a project no tool returned, then accepts the corrected answer", async () => {
    const invented = { ...GOOD, projects: [{ slug: "moonbase", why: "Made up" }] };
    const { client, requests } = fakeClient(
      reply([toolUse("search_projects", { query: "x" })]),
      reply([toolUse("submit_answer", invented)]),
      reply([toolUse("submit_answer", GOOD)]),
    );
    const events = await collect(client);
    expect(events.at(-1)).toMatchObject({ type: "final", answer: GOOD });
    const feedback = JSON.stringify(requests[2]!.messages.at(-1));
    expect(feedback).toContain("moonbase");
    expect(feedback).toContain("is_error");
  });

  it("rejects text naming a library project that no tool returned", async () => {
    const sneaky = { ...GOOD, answer: "Yes: Calmly Care, and Ledgerly too." };
    const { client } = fakeClient(
      reply([toolUse("search_projects", { query: "x" })]),
      reply([toolUse("submit_answer", sneaky)]),
      reply([toolUse("submit_answer", sneaky)]),
      reply([toolUse("submit_answer", sneaky)]),
    );
    await expect(collect(client)).rejects.toMatchObject({ kind: "no_answer" });
  });

  it("reminds the model to use submit_answer when it replies in plain text", async () => {
    const { client, requests } = fakeClient(
      reply([toolUse("search_projects", { query: "x" })]),
      reply([text("Yes, Calmly Care.")], "end_turn"),
      reply([toolUse("submit_answer", GOOD)]),
    );
    expect((await collect(client)).at(-1)).toMatchObject({ type: "final" });
    expect(JSON.stringify(requests[2]!.messages.at(-1))).toContain("submit_answer");
  });

  it("won't accept submit_answer in the same breath as other tools", async () => {
    const { client } = fakeClient(
      reply([toolUse("search_projects", { query: "x" }), toolUse("submit_answer", GOOD)]),
      reply([toolUse("submit_answer", GOOD)]),
    );
    const events = await collect(client);
    expect(events.filter((event) => event.type === "final")).toHaveLength(1);
    expect(tools.runTool).toHaveBeenCalledTimes(1);
  });

  it("stops running tools after the limit and tells the model to answer", async () => {
    const many = Array.from({ length: AI_CONFIG.agent.maxToolCalls + 2 }, () => toolUse("get_project", { project: "calmly-care" }));
    const { client, requests } = fakeClient(reply([toolUse("search_projects", { query: "x" })]), reply(many), reply([toolUse("submit_answer", GOOD)]));
    await collect(client);
    expect(tools.runTool).toHaveBeenCalledTimes(AI_CONFIG.agent.maxToolCalls);
    expect(JSON.stringify(requests[2]!.messages.at(-1))).toContain("Tool limit reached");
  });

  it("ends with a typed error on refusal", async () => {
    const { client } = fakeClient(reply([], "refusal"));
    const failure = collect(client);
    await expect(failure).rejects.toBeInstanceOf(AgentError);
    await expect(failure).rejects.toMatchObject({ kind: "refused" });
  });

  it("sends earlier turns before the question", async () => {
    const { client, requests } = fakeClient(reply([toolUse("search_projects", { query: "x" })]), reply([toolUse("submit_answer", GOOD)]));
    await collect(client, [{ question: "Tell me about Calmly Care", answer: "Calmly Care is a patient app." }]);
    const first = requests[0]!;
    expect(first.messages.map((message) => message.role)).toEqual(["user", "assistant", "user"]);
  });
});
