import { beforeEach, describe, expect, it } from "vitest";
import { getAskStats, insertConversation, setConversationFeedback } from "@/server/repositories/conversations";
import { insertGap, listOpenGaps, resolveGap } from "@/server/repositories/knowledge-gaps";
import { insertVerifiedAnswer, listVerifiedAnswers, softDeleteVerifiedAnswer } from "@/server/repositories/verified-answers";
import { resetDatabase } from "./database";

const USER = "64b7f0c2a1b2c3d4e5f60718";
const NOW = new Date("2026-10-14T12:00:00Z");

function turn(turnId: string, createdAt: Date, preview: boolean) {
  return {
    turn_id: turnId,
    user_id: USER,
    question: "Have we done a healthcare chatbot?",
    verdict: "yes" as const,
    project_slugs: ["calmly-care"],
    tools_called: [],
    latency_ms: 120,
    preview,
    created_at: createdAt,
  };
}

beforeEach(async () => {
  await resetDatabase();
});

describe("conversations", () => {
  it("counts questions per week and rates only real answers", async () => {
    await insertConversation(turn("11111111-1111-4111-8111-111111111111", new Date("2026-10-13T09:00:00Z"), false));
    await insertConversation(turn("22222222-2222-4222-8222-222222222222", new Date("2026-10-14T09:00:00Z"), true));
    await insertConversation(turn("33333333-3333-4333-8333-333333333333", new Date("2026-10-06T09:00:00Z"), false));
    await setConversationFeedback("11111111-1111-4111-8111-111111111111", USER, { rating: "up" });
    await setConversationFeedback("22222222-2222-4222-8222-222222222222", USER, { rating: "up" });
    await setConversationFeedback("33333333-3333-4333-8333-333333333333", USER, { rating: "down" });

    const stats = await getAskStats(8, NOW);

    expect(stats.totalQuestions).toBe(3);
    expect(stats.weekly.map((week) => [week.week.toISOString().slice(0, 10), week.count])).toEqual([
      ["2026-10-05", 1],
      ["2026-10-12", 2],
    ]);
    expect({ rated: stats.ratedAnswers, up: stats.thumbsUp }).toEqual({ rated: 2, up: 1 });
  });

  it("only lets the asker rate their own turn", async () => {
    await insertConversation(turn("44444444-4444-4444-8444-444444444444", NOW, false));
    expect(await setConversationFeedback("44444444-4444-4444-8444-444444444444", "64b7f0c2a1b2c3d4e5f60799", { rating: "down" })).toBeNull();
    expect(await setConversationFeedback("44444444-4444-4444-8444-444444444444", USER, { rating: "down" })).toMatchObject({
      feedback: { rating: "down" },
    });
  });
});

describe("knowledge gaps and verified answers", () => {
  it("lists open gaps and resolves each once", async () => {
    await insertGap({ question: "Have we built a VR game?", reason: "thumbs_down", user_id: USER });
    const [gap] = await listOpenGaps();
    if (!gap) throw new Error("expected a gap");

    expect(await resolveGap(gap.id, { type: "dismissed", by: USER })).toMatchObject({ status: "resolved" });
    expect(await resolveGap(gap.id, { type: "dismissed", by: USER })).toBeNull();
    expect(await listOpenGaps()).toEqual([]);
  });

  it("adds and soft-deletes verified answers", async () => {
    const answer = await insertVerifiedAnswer(
      { question: "Have we done a healthcare chatbot?", answer: "Yes: Calmly Care.", project_slugs: ["calmly-care"] },
      USER,
    );
    expect(await listVerifiedAnswers()).toHaveLength(1);
    expect(await softDeleteVerifiedAnswer(answer.id, USER)).toBe(true);
    expect(await listVerifiedAnswers()).toEqual([]);
  });
});
