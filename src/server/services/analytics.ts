import "server-only";
import { getCompleteness, type Completeness } from "@/lib/completeness";
import type { Project } from "@/schemas/project";
import { listAllVisibleProjects } from "@/server/repositories/projects";

export interface ProjectCompleteness {
  project: Pick<Project, "id" | "slug" | "name">;
  completeness: Completeness;
}

export interface LibraryHealth {
  projectCount: number;
  averageScore: number;
  leastComplete: ProjectCompleteness[];
}

/** How well documented the library is, and which records most need filling in. */
export async function getLibraryHealth(limit = 8): Promise<LibraryHealth> {
  const scored = (await listAllVisibleProjects()).map(({ id, slug, name, ...fields }) => ({
    project: { id, slug, name },
    completeness: getCompleteness(fields),
  }));
  const total = scored.reduce((sum, item) => sum + item.completeness.score, 0);
  return {
    projectCount: scored.length,
    averageScore: scored.length > 0 ? Math.round(total / scored.length) : 0,
    leastComplete: [...scored]
      .sort((a, b) => a.completeness.score - b.completeness.score || a.project.name.localeCompare(b.project.name))
      .slice(0, limit),
  };
}
