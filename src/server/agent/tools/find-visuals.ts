import "server-only";
import { z } from "zod";
import { tagKeySchema } from "@/schemas/tags";
import { searchLibrary } from "@/server/services/visuals";
import { defineTool } from "./types";

const MAX_VISUALS = 8;

export const findVisualsTool = defineTool({
  name: "find_visuals",
  description: [
    "Find uploaded screenshots of past work by caption or project name, optionally for one project or one flow (a flow tag key such as",
    `"onboarding"). Returns up to ${MAX_VISUALS} screens with their project and Figma frame link when recorded. Use it when someone asks to`,
    "see screens or designs. Captions are written by people and may be missing, so an empty result doesn't mean no work exists.",
  ].join(" "),
  input: z.object({
    query: z.string().trim().max(200).optional().describe("Words from a caption or a project name; omit to list a project's screens."),
    project: z.string().trim().max(100).optional().describe("A project slug from another tool's result."),
    flow: tagKeySchema.optional(),
  }),
  async run({ query, project, flow }) {
    const visuals = (await searchLibrary({ q: query || undefined, flow }))
      .filter((visual) => !project || visual.project.slug === project)
      .slice(0, MAX_VISUALS);
    return {
      content: {
        visuals: visuals.map((visual) => ({
          project: visual.project.slug,
          project_name: visual.project.name,
          caption: visual.caption ?? null,
          flow: visual.flow ?? null,
          figma_link: visual.figma_link ?? null,
          image_url: visual.url,
        })),
      },
      projectSlugs: [...new Set(visuals.map((visual) => visual.project.slug))],
    };
  },
});
