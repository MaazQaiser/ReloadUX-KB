import type Anthropic from "@anthropic-ai/sdk";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { askEventSchema, type AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { syncIndexes } from "@/server/db/indexes";
import { createLogger } from "@/server/logger";
import { streamAgentAnswer } from "@/server/services/agent-answer";
import { seedDatabase } from "../../scripts/seed/run";

// No Voyage: tools search by keywords, so the scripted conversation below is deterministic.
vi.mock("@/env", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/env")>()), getAiConfig: () => ({}) }));

const user = { id: "64b7f0c2a1b2c3d4e5f60799", role: "viewer" } as User;
let id = 0;
const toolUse = (name: string, input: unknown) => ({ type: "tool_use", id: `toolu_${++id}`, name, input });
const reply = (content: unknown[], stop_reason = "tool_use") =>
  ({ content, stop_reason, usage: { input_tokens: 1000, output_tokens: 100, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }) as unknown as Anthropic.Beta.BetaMessage;

function scripted(...replies: Anthropic.Beta.BetaMessage[]): Anthropic {
  const create = vi.fn(async () => {
    const next = replies.shift();
    if (!next) throw new Error("no more scripted replies");
    return next;
  });
  return { beta: { messages: { create } } } as unknown as Anthropic;
}

async function collect(client: Anthropic, question: string) {
  const events: AskEvent[] = [];
  for await (const event of streamAgentAnswer(client, question, [], user)) {
    expect(askEventSchema.safeParse(event).success).toBe(true);
    events.push(event);
  }
  return events;
}

beforeAll(async () => {
  const db = await getDb();
  await db.dropDatabase();
  await syncIndexes(db, { dryRun: false });
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

describe("streamAgentAnswer", () => {
  it("streams status, then cards built from the database, then text, and logs the turn", async () => {
    const client = scripted(
      reply([toolUse("search_projects", { query: "healthcare chatbot" })]),
      reply([toolUse("submit_answer", { verdict: "yes", projects: [{ slug: "calmly-care", why: "Symptom-check chatbot for patients" }], answer: "Yes: Calmly Care has a symptom-check chatbot." })]),
    );
    const events = await collect(client, "Have we done a healthcare chatbot?");

    const words = "Yes: Calmly Care has a symptom-check chatbot.".split(" ").length;
    expect(events.map((event) => event.type)).toEqual(["status", "status", "answer", ...Array(words).fill("text"), "done"]);
    const answer = events.find((event) => event.type === "answer");
    expect(answer).toMatchObject({
      verdict: "yes",
      projects: [{ slug: "calmly-care", name: "Calmly Care", industry: "healthcare", why: "Symptom-check chatbot for patients", links: [{ label: "Main file" }, expect.anything(), expect.anything()] }],
      records: [{ slug: "calmly-care", name: "Calmly Care" }],
    });
    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("expected done");
    expect(done.preview).toBe(false);

    const logged = await (await getDb()).collection(COLLECTIONS.conversations).findOne({ turn_id: done.turn_id });
    expect(logged).toMatchObject({ verdict: "yes", project_slugs: ["calmly-care"], tools_called: ["search_projects"], input_tokens: 2000, output_tokens: 200, preview: false });
  });

  it("turns a refusal into a friendly error and still logs the turn", async () => {
    const events = await collect(scripted(reply([], "refusal")), "Something odd");
    expect(events.at(-1)).toEqual({ type: "error", message: expect.stringContaining("rephrasing") });
    const logged = await (await getDb()).collection(COLLECTIONS.conversations).findOne({ question: "Something odd" });
    expect(logged).toMatchObject({ verdict: null, project_slugs: [], preview: false });
  });
});
