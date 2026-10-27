import "server-only";
import { z } from "zod";
import { insertGap } from "@/server/repositories/knowledge-gaps";
import { defineTool } from "./types";

export const logGapTool = defineTool({
  name: "log_gap",
  description: [
    "Record that this question couldn't be fully answered, so an admin can fix the records. Use it when a fact the user asked for",
    "is not recorded (reason \"not_recorded\", e.g. no designer or delivery date on file), or when you answer No without a",
    "convincing near match (reason \"low_confidence_no\"). Call it at most once per answer; it doesn't change your reply.",
  ].join(" "),
  input: z.object({
    reason: z.enum(["not_recorded", "low_confidence_no"]),
    note: z.string().trim().min(3).max(500).describe("What was missing, e.g. \"Calmly Care has no delivery date\"."),
  }),
  async run({ reason, note }, { question, turnId, user }) {
    await insertGap({ question, reason, note, turn_id: turnId, user_id: user.id });
    return { content: { logged: true }, projectSlugs: [] };
  },
});
