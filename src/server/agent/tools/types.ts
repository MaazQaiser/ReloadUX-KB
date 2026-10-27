import "server-only";
import type { z } from "zod";
import type { TagCatalog } from "@/lib/tag-catalog";
import type { User } from "@/schemas/user";

export interface ToolContext {
  user: User;
  turnId: string;
  question: string;
  catalog: TagCatalog;
}

/**
 * What a tool hands back: `content` goes to the model as JSON; `projectSlugs`
 * are the projects this result revealed, which are the only projects the
 * final answer may cite (the fact guard checks against them).
 */
export interface ToolOutput {
  content: unknown;
  projectSlugs: string[];
}

export interface AgentTool<S extends z.ZodObject = z.ZodObject> {
  name: string;
  /** Written for the model: when to use it, what it returns, what it can't do. */
  description: string;
  input: S;
  run(input: z.infer<S>, context: ToolContext): Promise<ToolOutput>;
}

export function defineTool<S extends z.ZodObject>(tool: AgentTool<S>): AgentTool<S> {
  return tool;
}
