import "server-only";
import { z } from "zod";
import { PROJECT_STATUS } from "@/lib/constants";
import { tagKeySchema } from "@/schemas/tags";
import { listPeople } from "@/server/repositories/people";
import { listAllMatchingProjects } from "@/server/repositories/projects";
import { projectSummary } from "./project-view";
import { defineTool } from "./types";

const MAX_LIST = 20;

export const listProjectsTool = defineTool({
  name: "list_projects",
  description: [
    "List and count projects by exact criteria: tags, a designer's name, a delivery year or status, e.g. \"mobile apps delivered in 2025\",",
    "\"projects Sara led\", \"how many fintech projects\". Unlike search_projects there's no ranking: it returns the total count and up to",
    `${MAX_LIST} projects, newest delivery first. Tag filters use lowercase keys with underscores (e.g. product_type "mobile_app_ios").`,
  ].join(" "),
  input: z.object({
    industry: tagKeySchema.optional(),
    product_type: tagKeySchema.optional(),
    ai_feature: tagKeySchema.optional(),
    flow: tagKeySchema.optional(),
    business_model: tagKeySchema.optional(),
    designer: z.string().trim().min(2).max(100).optional().describe("A designer's name; matches lead or team designer."),
    delivered_year: z.number().int().min(2000).max(2100).optional(),
    status: z.enum(PROJECT_STATUS.keys).optional(),
    limit: z.number().int().min(1).max(MAX_LIST).optional(),
  }),
  async run({ designer, delivered_year, status, limit = MAX_LIST, ...tags }, { catalog }) {
    let designerId: string | undefined;
    if (designer) {
      const wanted = designer.toLowerCase();
      const matches = (await listPeople()).filter((person) => person.name.toLowerCase().includes(wanted));
      if (matches.length !== 1 || !matches[0]) {
        return {
          content: { total: 0, projects: [], note: matches.length === 0 ? `No designer named "${designer}".` : `"${designer}" matches several people: ${matches.map((person) => person.name).join(", ")}.` },
          projectSlugs: [],
        };
      }
      designerId = matches[0].id;
    }
    const items = (await listAllMatchingProjects({ ...tags, designer: designerId, year: delivered_year }))
      .filter((project) => !status || project.status === status)
      // Newest delivery first; undelivered (often ongoing) last.
      .sort((a, b) => (b.delivery_date?.getTime() ?? 0) - (a.delivery_date?.getTime() ?? 0));
    const shown = items.slice(0, limit);
    return {
      content: { total: items.length, projects: shown.map((project) => projectSummary(project, catalog)) },
      projectSlugs: shown.map((project) => project.slug),
    };
  },
});
