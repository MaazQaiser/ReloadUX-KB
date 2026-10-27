import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAiConfig } from "@/env";
import { AI_CONFIG } from "./config";

let client: Anthropic | undefined;

/** The shared Claude client, or null when no API key is configured (the Ask screen then stays in preview). */
export function getClaude(): Anthropic | null {
  const { anthropicApiKey } = getAiConfig();
  if (!anthropicApiKey) return null;
  // The SDK retries 408/409/429/5xx and connection errors with backoff.
  client ??= new Anthropic({
    apiKey: anthropicApiKey,
    maxRetries: AI_CONFIG.agent.maxRetries,
    timeout: AI_CONFIG.agent.timeoutMs,
  });
  return client;
}
