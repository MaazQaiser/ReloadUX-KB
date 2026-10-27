import { describe, expect, it, vi } from "vitest";
import { askEventSchema, type AskEvent } from "@/schemas/answer";
import type { User } from "@/schemas/user";
import * as conversations from "@/server/repositories/conversations";
import * as gaps from "@/server/repositories/knowledge-gaps";
import * as visuals from "@/server/services/visuals";
import { recordAnswerFeedback, streamAnswer, toDeltas } from "./ask";

vi.mock("@/server/repositories/conversations");
vi.mock("@/server/repositories/knowledge-gaps");
vi.mock("@/server/services/visuals", () => ({ getCoverUrls: vi.fn(async () => new Map<string, string>()) }));

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

  it("puts the project's cover screenshot on its card", async () => {
    vi.mocked(visuals.getCoverUrls).mockResolvedValueOnce(new Map([["calmly-care", "/api/files/projects/calmly-care/cover.png"]]));
    const events = await collect("Have we done a healthcare chatbot?");
    expect(events[1]).toMatchObject({ type: "answer", projects: [{ slug: "calmly-care", cover_url: "/api/files/projects/calmly-care/cover.png" }] });
  });

  it("still answers, without thumbnails, when the cover lookup fails", async () => {
    vi.mocked(visuals.getCoverUrls).mockRejectedValueOnce(new Error("database down"));
    const events = await collect("Have we done a healthcare chatbot?");
    const answer = events[1];
    expect(answer).toMatchObject({ type: "answer", verdict: "yes" });
    expect(answer?.type === "answer" && answer.projects[0]?.cover_url).toBeFalsy();
    expect(events.at(-1)).toMatchObject({ type: "done" });
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

describe("logging", () => {
  it("logs each finished turn as a preview conversation", async () => {
    vi.mocked(conversations.insertConversation).mockClear();
    const events = await collect("Have we done a healthcare chatbot?");
    const done = events.at(-1);

    expect(conversations.insertConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        turn_id: done?.type === "done" ? done.turn_id : "",
        user_id: user.id,
        question: "Have we done a healthcare chatbot?",
        preview: true,
      }),
    );
  });
});

describe("recordAnswerFeedback", () => {
  const turn = {
    id: "64b7f0c2a1b2c3d4e5f60720",
    turn_id: "0b6f1c1e-5c47-4b5e-9a39-1d3c8f2a9b10",
    user_id: user.id,
    question: "Have we built a VR game?",
    verdict: "no" as const,
    project_slugs: [],
    tools_called: [],
    latency_ms: 10,
    preview: false,
    created_at: new Date(),
  };

  it("refuses a turn that isn't the user's", async () => {
    vi.mocked(conversations.setConversationFeedback).mockResolvedValue(null);
    expect(await recordAnswerFeedback({ turn_id: turn.turn_id, rating: "up" }, user)).toBe(false);
  });

  it("turns a thumbs down on a real answer into a knowledge gap", async () => {
    vi.mocked(gaps.insertGap).mockClear();
    vi.mocked(conversations.setConversationFeedback).mockResolvedValue(turn);

    expect(await recordAnswerFeedback({ turn_id: turn.turn_id, rating: "down", note: "Missed Questline" }, user)).toBe(true);
    expect(gaps.insertGap).toHaveBeenCalledWith(
      expect.objectContaining({ question: turn.question, reason: "thumbs_down", note: "Missed Questline" }),
    );
  });

  it("doesn't open gaps from preview answers or thumbs up", async () => {
    vi.mocked(gaps.insertGap).mockClear();
    vi.mocked(conversations.setConversationFeedback).mockResolvedValue({ ...turn, preview: true });
    await recordAnswerFeedback({ turn_id: turn.turn_id, rating: "down" }, user);
    vi.mocked(conversations.setConversationFeedback).mockResolvedValue(turn);
    await recordAnswerFeedback({ turn_id: turn.turn_id, rating: "up" }, user);

    expect(gaps.insertGap).not.toHaveBeenCalled();
  });
});
