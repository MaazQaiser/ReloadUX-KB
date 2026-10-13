import "server-only";
import type { Link } from "@/schemas/common";
import type { Project } from "@/schemas/project";
import { listAllVisibleProjects } from "@/server/repositories/projects";

export interface ProjectFigmaFiles {
  project: Pick<Project, "id" | "slug" | "name" | "industry" | "product_types">;
  files: Link[];
}

/**
 * Until screenshot uploads exist, the Figma files recorded on projects are
 * the visual record we have, so the library starts from them.
 */
export async function listFigmaFilesByProject(): Promise<ProjectFigmaFiles[]> {
  return (await listAllVisibleProjects())
    .filter((project) => project.figma_files.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ id, slug, name, industry, product_types, figma_files }) => ({
      project: { id, slug, name, industry, product_types },
      files: figma_files,
    }));
}
