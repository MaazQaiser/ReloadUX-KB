import "server-only";

/**
 * Every model name and limit the agent and search use, in one place
 * (CLAUDE.md: "model names, embedding model and limits come from config").
 */
export const AI_CONFIG = {
  agent: {
    model: "claude-opus-5-5",
    // Opus 5.5 defaults to medium; set it explicitly so a default change can't move answers.
    effort: "medium",
    maxTokens: 16_000,
    /** Tool calls allowed in one turn before the agent must answer with what it has. */
    maxToolCalls: 8,
    /** Wall-clock budget for one question, tools included. */
    timeoutMs: 60_000,
    /** Earlier turns sent with a follow-up question, newest last. */
    historyTurns: 4,
    /** Re-runs a safety decline on Anthropic's recommended model instead of failing the answer. */
    fallbackBeta: "server-side-fallback-2026-07-01",
    maxRetries: 3,
  },
  voyage: {
    baseUrl: "https://api.voyageai.com/v1",
    embedModel: "voyage-4",
    dimensions: 1024,
    rerankModel: "rerank-3",
    /** Voyage allows 1,000 texts per call; smaller batches keep one failure cheap. */
    batchSize: 64,
    timeoutMs: 20_000,
    maxRetries: 3,
  },
  search: {
    /** What search_projects hands back, per SPEC.md. */
    topK: 5,
    /** Candidates gathered from vector and keyword search before reranking. */
    candidates: 30,
    /** How close a question must be to an approved one for its verified answer to be offered. */
    verifiedAnswerSimilarity: 0.82,
    /** The same bar by shared words, used when Voyage isn't connected. */
    verifiedAnswerOverlap: 0.6,
  },
  chunks: {
    /** About 300 to 800 tokens per chunk (SPEC.md), measured in characters at ~4 per token. */
    minChars: 1_200,
    maxChars: 3_200,
  },
} as const;
