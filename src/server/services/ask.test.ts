import { describe, expect, it, vi } from "vitest";
import { askEventSchema, type AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import { streamAnswer, toDeltas } from "./ask";

vi.mock("@/server/logger", () => {
  const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: () => log };
  return { logger: log };
});

const user = { id: "64b7f0c2a1b2c3d4e5f60718", role: "viewer" } as User;

async function collect(question: string, signal?: AbortSignal) {
  const events: AskEvent[] = [];
  for await (const event of streamAnswer(question, user, { delayMs: 0, signal })) events.push(event);
  return events;
}

const textOf = (events: AskEvent[]) => events.map((event) => (event.type === "text" ? event.delta : "")).join("");

describe("toDeltas", () => {
  it("splits into words whose concatenation is the original text", () => {
    const text = "No VR project.  The closest is Questline.";
    expect(toDeltas(text).join("")).toBe(text);
    expect(toDeltas("")).toEqual([]);
  });
});

describe("streamAnswer (preview)", () => {
  it("emits valid events: status, then the verdict and cards, then text, then done", async () => {
    const events = await collect("Have we done a Healthcare CHATBOT?");

    for (const event of events) expect(askEventSchema.safeParse(event).success).toBe(true);
    expect(events[0]?.type).toBe("status");
    expect(events[1]).toMatchObject({ type: "answer", verdict: "yes", projects: [{ slug: "calmly-care" }] });
    expect(events.at(-1)).toMatchObject({ type: "done", preview: true });
    expect(textOf(events)).toContain("Calmly Care");
  });

  it("answers No with the closest match for something we haven't done", async () => {
    const events = await collect("have we built a VR game?");
    expect(events[1]).toMatchObject({ type: "answer", verdict: "no", projects: [{ slug: "questline" }] });
  });

  it("says it is a preview instead of guessing for other questions", async () => {
    const events = await collect("what is our office wifi password?");
    expect(events[1]).toEqual({ type: "answer", verdict: null, projects: [], records: [] });
    expect(textOf(events)).toContain("preview");
  });

  it("stops streaming text once the request is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const events = await collect("have we done a healthcare chatbot?", controller.signal);
    expect(events.some((event) => event.type === "text" || event.type === "done")).toBe(false);
  });
});
