import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { logger } from "@/server/logger";
import { findVisualsTool } from "./find-visuals";
import { getProjectTool } from "./get-project";
import { getVerifiedAnswerTool } from "./get-verified-answer";
import { listProjectsTool } from "./list-projects";
import { logGapTool } from "./log-gap";
import { searchProjectsTool } from "./search-projects";
import type { AgentTool, ToolContext, ToolOutput } from "./types";

const log = logger.child({ module: "agent-tools" });

/** In a fixed order: the tool list is part of the cached prompt prefix, so it must not shuffle. */
export const AGENT_TOOLS: readonly AgentTool[] = [
  getVerifiedAnswerTool,
  searchProjectsTool,
  getProjectTool,
  listProjectsTool,
  findVisualsTool,
  logGapTool,
];

/** The tool as the API sees it: name, description and a JSON schema made from the Zod input. */
export function toToolDefinition(tool: Pick<AgentTool, "name" | "description" | "input">): Anthropic.Tool {
  // The API takes the schema body; the "$schema" dialect marker isn't part of it.
  const schema = Object.fromEntries(Object.entries(z.toJSONSchema(tool.input)).filter(([key]) => key !== "$schema"));
  return { name: tool.name, description: tool.description, input_schema: { ...schema, type: "object" } };
}

export type ToolRun = { ok: true; output: ToolOutput } | { ok: false; error: string };

/**
 * Runs one tool call. Input is validated first (the model's arguments are
 * untrusted), and failures come back as an error result the model can read
 * and recover from rather than an exception that ends the turn.
 */
export async function runTool(name: string, rawInput: unknown, context: ToolContext): Promise<ToolRun> {
  const tool = AGENT_TOOLS.find((candidate) => candidate.name === name);
  if (!tool) return { ok: false, error: `There is no tool called ${name}.` };
  const input = tool.input.safeParse(rawInput);
  if (!input.success) {
    return { ok: false, error: `Invalid input: ${input.error.issues.map((issue) => `${issue.path.join(".") || "input"} ${issue.message}`).join("; ")}` };
  }
  try {
    return { ok: true, output: await tool.run(input.data, context) };
  } catch (error) {
    log.error("tool failed", { tool: name, turnId: context.turnId, error });
    return { ok: false, error: `${name} failed. Try once more, or answer with what you already have.` };
  }
}
