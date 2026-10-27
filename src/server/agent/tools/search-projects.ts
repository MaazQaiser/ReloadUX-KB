import "server-only";
import { z } from "zod";
import { tagKeySchema } from "@/schemas/tags";
import { searchProjects } from "@/server/services/search";
import { projectSummary } from "./project-view";
import { defineTool } from "./types";

export const searchProjectsTool = defineTool({
  name: "search_projects",
  description: [
    "Find past reloadux projects that match a description, e.g. \"healthcare chatbot\" or \"AI onboarding for a fintech app\".",
    "Use it first for any \"have we done X?\" question. It combines meaning-based and keyword search and returns up to 5 projects, best first,",
    "each with a 0-1 score and why it matched (tags the question names, the closest passage, whether the words matched).",
    "Filters are optional tag keys (lowercase, underscores, e.g. industry \"healthcare\", ai_feature \"chatbot\", business_model \"b2b\"); only add one when the question clearly requires it.",
    "A low score or no results means we may not have done it: say so rather than stretching a weak match.",
  ].join(" "),
  input: z.object({
    query: z.string().trim().min(2).max(500).describe("What to look for, in plain words."),
    industry: tagKeySchema.optional(),
    product_type: tagKeySchema.optional(),
    ai_feature: tagKeySchema.optional(),
    flow: tagKeySchema.optional(),
    business_model: tagKeySchema.optional(),
  }),
  async run({ query, ...filters }, { catalog }) {
    const results = await searchProjects(query, filters);
    return {
      content: {
        results: results.map(({ project, score, why }) => ({ ...projectSummary(project, catalog), score, why })),
      },
      projectSlugs: results.map(({ project }) => project.slug),
    };
  },
});
