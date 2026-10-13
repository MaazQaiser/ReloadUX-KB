import "server-only";
import { detectImageKind, IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/image-type";
import { err, ok, toValidationIssues, type Result } from "@/lib/result";
import type { Link } from "@/schemas/common";
import type { Project } from "@/schemas/project";
import type { Flow } from "@/schemas/tags";
import type { User } from "@/schemas/user";
import { visualEditSchema, type Visual } from "@/schemas/visual";
import { findProjectBySlug, listAllVisibleProjects, setProjectVisualMembership } from "@/server/repositories/projects";
import {
  findVisual,
  insertVisual,
  listProjectVisuals,
  moveVisual,
  searchVisuals,
  setCover,
  softDeleteVisual,
  updateVisual,
} from "@/server/repositories/visuals";
import { getImageStore } from "@/server/storage";
import { getTagCatalog } from "@/server/services/tags";

/** A screenshot as screens render it: the URL goes through the auth-checked file route. */
export interface VisualView {
  id: string;
  url: string;
  caption?: string;
  flow?: Flow;
  figma_link?: string;
  is_cover: boolean;
}

function toView(visual: Visual): VisualView {
  return {
    id: visual.id,
    url: getImageStore().url(visual.image_key),
    caption: visual.caption,
    flow: visual.flow,
    figma_link: visual.figma_link,
    is_cover: visual.is_cover,
  };
}

export async function getProjectGallery(projectId: string): Promise<VisualView[]> {
  return (await listProjectVisuals(projectId)).map(toView);
}

export async function searchLibrary(filters: { q?: string; flow?: Flow }) {
  return (await searchVisuals(filters)).map(({ visual, project }) => ({ ...toView(visual), project }));
}

export type UploadOutcome = { name: string; ok: true } | { name: string; ok: false; reason: string };

/**
 * Stores screenshots for a project (drafts included, so imports can be
 * illustrated before approval). Each file is checked by its bytes and size;
 * the stored name is ours, never the uploader's.
 */
export async function uploadVisuals(
  editor: User,
  projectSlug: string,
  files: { name: string; bytes: Uint8Array }[],
): Promise<Result<UploadOutcome[], "project_not_found">> {
  const project = await findProjectBySlug(projectSlug, { includeDrafts: true });
  if (!project) return err("project_not_found");

  const outcomes: UploadOutcome[] = [];
  for (const file of files) {
    if (file.bytes.byteLength > MAX_IMAGE_BYTES) {
      outcomes.push({ name: file.name, ok: false, reason: "is over 10 MB" });
      continue;
    }
    const kind = detectImageKind(file.bytes);
    if (!kind) {
      outcomes.push({ name: file.name, ok: false, reason: "isn't a PNG, JPG or WebP image" });
      continue;
    }
    const key = `projects/${project.slug}/${crypto.randomUUID()}.${IMAGE_TYPES[kind].extension}`;
    await getImageStore().put(key, file.bytes);
    const visual = await insertVisual(project.id, key, editor.id);
    await setProjectVisualMembership(project.id, visual.id, true);
    outcomes.push({ name: file.name, ok: true });
  }
  return ok(outcomes);
}

export async function editVisual(editor: User, id: string, raw: unknown) {
  const edit = visualEditSchema.safeParse(raw);
  if (!edit.success) return err({ kind: "invalid" as const, issues: toValidationIssues(edit.error) });
  if (edit.data.flow && !(edit.data.flow in (await getTagCatalog()).flows.labels)) {
    return err({ kind: "invalid" as const, issues: [{ path: "flow", message: "isn't a known flow" }] });
  }
  const updated = await updateVisual(id, edit.data, editor.id);
  return updated ? ok(toView(updated)) : err({ kind: "not_found" as const });
}

export type VisualCommand = "cover" | "earlier" | "later" | "remove";

export async function runVisualCommand(editor: User, id: string, command: VisualCommand): Promise<Result<null, "not_found">> {
  const visual = await findVisual(id);
  if (!visual) return err("not_found");
  if (command === "cover") await setCover(visual);
  else if (command === "remove") {
    await softDeleteVisual(visual, editor.id);
    await setProjectVisualMembership(visual.project_id, visual.id, false);
  } else await moveVisual(visual, command);
  return ok(null);
}

export interface ProjectFigmaFiles {
  project: Pick<Project, "id" | "slug" | "name" | "industry" | "product_types">;
  files: Link[];
}

/** The Figma files recorded on projects, listed alongside uploaded screens. */
export async function listFigmaFilesByProject(): Promise<ProjectFigmaFiles[]> {
  return (await listAllVisibleProjects())
    .filter((project) => project.figma_files.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ id, slug, name, industry, product_types, figma_files }) => ({
      project: { id, slug, name, industry, product_types },
      files: figma_files,
    }));
}
