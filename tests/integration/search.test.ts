import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "@/server/logger";
import { searchProjects } from "@/server/services/search";
import { seedDatabase } from "../../scripts/seed/run";
import { resetDatabase } from "./database";

// Vectors that point at a topic named in the text, so meaning-based matches are predictable.
const TOPICS = ["chatbot", "budget", "hr", "game", "therapy"] as const;
function topicVector(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = Array.from({ length: 1024 }, () => 0.001);
  TOPICS.forEach((topic, index) => {
    if (lower.includes(topic)) vector[index] = 1;
  });
  return vector;
}

const ai = vi.hoisted(() => ({ voyageApiKey: undefined as string | undefined }));
const voyage = vi.hoisted(() => ({
  embed: vi.fn(async (texts: readonly string[]) => texts.map((text) => topicVector(text))),
  // Stand-in reranker: documents mentioning the query's first word win.
  rerank: vi.fn(async (query: string, documents: readonly string[], topK: number) =>
    documents
      .map((document, index) => ({ index, score: document.toLowerCase().includes(query.split(" ")[0]!.toLowerCase()) ? 0.9 : 0.1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK),
  ),
}));
vi.mock("@/server/ai/voyage", () => voyage);
vi.mock("@/env", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/env")>()), getAiConfig: () => ai }));

beforeAll(async () => {
  await resetDatabase();
  // Seed with Voyage "connected" so every project gets chunks to search.
  ai.voyageApiKey = "test-voyage-key-0123456789";
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

beforeEach(() => {
  ai.voyageApiKey = "test-voyage-key-0123456789";
  voyage.embed.mockClear();
  voyage.rerank.mockClear();
});

describe("searchProjects without Voyage", () => {
  it("finds projects by keywords alone and says so", async () => {
    ai.voyageApiKey = undefined;
    const results = await searchProjects("chatbot healthcare");
    expect(results[0]).toMatchObject({ project: { slug: "calmly-care" }, why: { keyword: true } });
    expect(results[0]?.why.tags).toEqual(expect.arrayContaining(["healthcare", "chatbot"]));
    expect(voyage.embed).not.toHaveBeenCalled();
  });
});

describe("searchProjects with Voyage", () => {
  it("returns at most five, reranked, with the passage that matched", async () => {
    const results = await searchProjects("therapy booking app");
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0]).toMatchObject({ project: { slug: "calmly-care" } });
    expect(results[0]?.why.passage).toMatch(/therapy/i);
    expect(voyage.rerank).toHaveBeenCalledTimes(1);
  });

  it("finds a project by meaning even when no keyword matches", async () => {
    // "game" only reaches Questline through its vector; the words aren't in the query.
    const results = await searchProjects("anything like a game");
    expect(results.map((result) => result.project.slug)).toContain("questline");
  });

  it("applies tag filters to both halves", async () => {
    const results = await searchProjects("app", { industry: "fintech" });
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) expect(result.project.industry).toBe("fintech");
  });

  it("falls back to the fused order when the reranker fails", async () => {
    voyage.rerank.mockRejectedValueOnce(new Error("rerank down"));
    const results = await searchProjects("chatbot");
    expect(results[0]).toMatchObject({ project: { slug: "calmly-care" } });
  });
});
