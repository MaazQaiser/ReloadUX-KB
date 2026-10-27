import "server-only";
import { z } from "zod";
import { getAiConfig } from "@/env";
import { AI_CONFIG } from "./config";

/** Voyage embeds a search question and a stored document slightly differently; say which this is. */
export type EmbedInputType = "query" | "document";

export class VoyageError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VoyageError";
  }
}

const embeddingResponseSchema = z.object({
  data: z.array(z.object({ index: z.number().int().nonnegative(), embedding: z.array(z.number()) })),
  usage: z.object({ total_tokens: z.number().int().nonnegative() }).optional(),
});

const rerankItemSchema = z.object({ index: z.number().int().nonnegative(), relevance_score: z.number() });
// The REST API returns `data`; some documentation shows the client's `results`. Accept either.
const rerankResponseSchema = z.union([
  z.object({ data: z.array(rerankItemSchema) }).transform((body) => body.data),
  z.object({ results: z.array(rerankItemSchema) }).transform((body) => body.results),
]);

export interface VoyageOptions {
  /** Injected in tests. */
  fetchImpl?: typeof fetch;
  /** Pause before retry N (1-based). Injected in tests to skip waiting. */
  backoffMs?: (attempt: number) => number;
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const defaultBackoff = (attempt: number) => Math.min(8_000, 500 * 2 ** (attempt - 1)) + Math.random() * 250;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function apiKey(): string {
  const key = getAiConfig().voyageApiKey;
  if (!key) throw new VoyageError("VOYAGE_API_KEY isn't set");
  return key;
}

async function post(path: string, body: unknown, options: VoyageOptions): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const backoff = options.backoffMs ?? defaultBackoff;
  const { maxRetries, timeoutMs, baseUrl } = AI_CONFIG.voyage;

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey()}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      // Network failures and timeouts are worth another try; the key error above is not.
      if (error instanceof VoyageError || attempt >= maxRetries) {
        throw error instanceof VoyageError ? error : new VoyageError(`Voyage request failed: ${String(error)}`);
      }
      await sleep(backoff(attempt + 1));
      continue;
    }
    if (response.ok) return response.json();
    if (!RETRYABLE.has(response.status) || attempt >= maxRetries) {
      // The body can echo input text, so only the status reaches logs and errors.
      throw new VoyageError(`Voyage ${path} returned ${response.status}`, response.status);
    }
    await sleep(backoff(attempt + 1));
  }
}

/** One vector per text, in input order. Sent in batches so a long backfill doesn't hit request limits. */
export async function embed(texts: readonly string[], inputType: EmbedInputType, options: VoyageOptions = {}): Promise<number[][]> {
  const { embedModel, dimensions, batchSize } = AI_CONFIG.voyage;
  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const raw = await post(
      "/embeddings",
      { input: batch, model: embedModel, input_type: inputType, output_dimension: dimensions },
      options,
    );
    const parsed = embeddingResponseSchema.safeParse(raw);
    if (!parsed.success || parsed.data.data.length !== batch.length) {
      throw new VoyageError("Voyage returned an unexpected embeddings response");
    }
    const ordered = [...parsed.data.data].sort((a, b) => a.index - b.index);
    for (const item of ordered) {
      if (item.embedding.length !== dimensions) throw new VoyageError(`Voyage returned ${item.embedding.length} dimensions, expected ${dimensions}`);
      vectors.push(item.embedding);
    }
  }
  return vectors;
}

/** Documents re-scored against the query, best first: each result points back at its input index. */
export async function rerank(
  query: string,
  documents: readonly string[],
  topK: number,
  options: VoyageOptions = {},
): Promise<{ index: number; score: number }[]> {
  if (documents.length === 0) return [];
  const raw = await post("/rerank", { query, documents, model: AI_CONFIG.voyage.rerankModel, top_k: topK }, options);
  const parsed = rerankResponseSchema.safeParse(raw);
  if (!parsed.success) throw new VoyageError("Voyage returned an unexpected rerank response");
  return parsed.data
    .filter((item) => item.index < documents.length)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .map((item) => ({ index: item.index, score: item.relevance_score }));
}
