import "server-only";
import { err, ok, type Result } from "@/lib/result";
import type { Project } from "@/schemas/project";
import type { User } from "@/schemas/user";
import { approveProjectById, listDraftProjects } from "@/server/repositories/projects";

export async function listDrafts(): Promise<Project[]> {
  return listDraftProjects();
}

/** Makes a draft visible as it stands. To change it first, edit it: saving an edit also approves. */
export async function approveDraft(admin: User, id: string): Promise<Result<Project, "not_found">> {
  const approved = await approveProjectById(id, admin.id);
  return approved ? ok(approved) : err("not_found");
}
