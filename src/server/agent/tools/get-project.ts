import "server-only";
import { z } from "zod";
import { toSlug } from "@/lib/slug";
import { findProjectsByKeywords } from "@/server/repositories/project-search";
import { getProjectDetail } from "@/server/services/projects";
import { projectRecord } from "./project-view";
import { defineTool } from "./types";

export const getProjectTool = defineTool({
  name: "get_project",
  description: [
    "Get everything recorded about one project: client, type, business model, personas, AI features, flows, services, people",
    "(lead designer, designers, account manager, client contact), start and delivery dates, duration, milestones, links (Figma,",
    "prototype, live, case study, Drive), the story (challenge, what we did, outcomes, testimonial), metrics and the client-safe summary.",
    "Pass the slug from another tool's result, or the project's name as people say it. If the name is ambiguous it returns",
    "candidates to choose from instead. Fields that are null are not recorded: say \"not recorded\", never guess them.",
  ].join(" "),
  input: z.object({
    project: z.string().trim().min(2).max(200).describe("A slug like \"calmly-care\" or a name like \"Calmly Care\"."),
  }),
  async run({ project }, { catalog }) {
    const exact = (await getProjectDetail(project)) ?? (await getProjectDetail(toSlug(project)));
    if (exact) return { content: { project: projectRecord(exact, catalog) }, projectSlugs: [exact.project.slug] };

    const candidates = await findProjectsByKeywords(project, {}, 3);
    if (candidates.length === 1 && candidates[0]) {
      const detail = await getProjectDetail(candidates[0].project.slug);
      if (detail) return { content: { project: projectRecord(detail, catalog) }, projectSlugs: [detail.project.slug] };
    }
    return {
      content: {
        project: null,
        candidates: candidates.map(({ project: match }) => ({ slug: match.slug, name: match.name, client: match.client_name ?? null })),
        note: candidates.length === 0 ? "No project by that name." : "Several projects match; call get_project again with one slug.",
      },
      projectSlugs: candidates.map(({ project: match }) => match.slug),
    };
  },
});
