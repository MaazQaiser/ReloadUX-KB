import { beforeEach, describe, expect, it, vi } from "vitest";
import { AI_CONFIG } from "./config";
import { embed, rerank, VoyageError } from "./voyage";

const config = vi.hoisted(() => ({ voyageApiKey: "test-voyage-key-0123456789" as string | undefined }));
vi.mock("@/env", () => ({ getAiConfig: () => config }));

const DIMS = AI_CONFIG.voyage.dimensions;
const vector = (seed: number) => Array.from({ length: DIMS }, () => seed);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const noWait = { backoffMs: () => 0 };

beforeEach(() => {
  config.voyageApiKey = "test-voyage-key-0123456789";
});

describe("embed", () => {
  it("batches requests and returns vectors in input order", async () => {
    const texts = Array.from({ length: AI_CONFIG.voyage.batchSize + 2 }, (_, index) => `text ${index}`);
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { input: string[]; input_type: string };
      expect(body.input_type).toBe("document");
      // Reversed on purpose: the client must sort by index.
      return json({ data: body.input.map((text, index) => ({ index, embedding: vector(Number(text.split(" ")[1])) })).reverse() });
    });

    const vectors = await embed(texts, "document", { fetchImpl, ...noWait });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(vectors.map((v) => v[0])).toEqual(texts.map((_, index) => index));
  });

  it("retries rate limits and server errors, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ detail: "slow down" }, 429))
      .mockResolvedValueOnce(json({ detail: "oops" }, 503))
      .mockResolvedValueOnce(json({ data: [{ index: 0, embedding: vector(1) }] }));

    expect(await embed(["a"], "query", { fetchImpl, ...noWait })).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("gives up on client errors without retrying, and never echoes the body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ detail: "secret input text" }, 400));
    const failure = embed(["secret input text"], "query", { fetchImpl, ...noWait });
    await expect(failure).rejects.toThrow(VoyageError);
    await expect(failure).rejects.not.toThrow(/secret/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops after the retry limit", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({}, 429));
    await expect(embed(["a"], "query", { fetchImpl, ...noWait })).rejects.toMatchObject({ status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(AI_CONFIG.voyage.maxRetries + 1);
  });

  it("rejects vectors of the wrong size", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ data: [{ index: 0, embedding: [1, 2, 3] }] }));
    await expect(embed(["a"], "query", { fetchImpl, ...noWait })).rejects.toThrow(/dimensions/);
  });

  it("refuses to run without an API key", async () => {
    config.voyageApiKey = undefined;
    const fetchImpl = vi.fn();
    await expect(embed(["a"], "query", { fetchImpl, ...noWait })).rejects.toThrow(/VOYAGE_API_KEY/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("rerank", () => {
  it("returns indexes best first, from either response shape", async () => {
    const items = [
      { index: 0, relevance_score: 0.2 },
      { index: 2, relevance_score: 0.9 },
    ];
    for (const body of [{ data: items }, { results: items }]) {
      const fetchImpl = vi.fn().mockResolvedValue(json(body));
      expect(await rerank("q", ["a", "b", "c"], 2, { fetchImpl, ...noWait })).toEqual([
        { index: 2, score: 0.9 },
        { index: 0, score: 0.2 },
      ]);
    }
  });

  it("skips the call for an empty list", async () => {
    const fetchImpl = vi.fn();
    expect(await rerank("q", [], 5, { fetchImpl })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
