"use server";

import { z } from "zod";
import { toFormErrors, toProjectInput } from "@/lib/project-form";
import { toSlug } from "@/lib/slug";
import { idSchema, slugSchema } from "@/schemas/common";
import { projectFormValuesSchema } from "@/schemas/project-form";
import { personRoleSchema } from "@/schemas/tags";
import { requireRole } from "@/server/auth";
import { createPerson } from "@/server/services/people";
import { createProject, updateProject, type CreateProjectError, type UpdateProjectError } from "@/server/services/projects";

export type ProjectActionResult =
  | { ok: true; slug: string }
  | { ok: false; message: string; errors: Record<string, string> };

const MALFORMED: ProjectActionResult = {
  ok: false,
  message: "The form couldn't be read. Reload the page and try again.",
  errors: {},
};

function toActionError(error: CreateProjectError | UpdateProjectError): ProjectActionResult {
  switch (error.kind) {
    case "invalid":
      return {
        ok: false,
        message: "Some fields need fixing.",
        // The slug comes from the name, so a slug problem is a name problem.
        errors: toFormErrors(error.issues.map((issue) => (issue.path === "slug" ? { ...issue, path: "name" } : issue))),
      };
    case "unknown_people":
      return {
        ok: false,
        message: "Someone picked in People no longer exists. Pick again.",
        errors: { lead_designer: "Pick an existing person." },
      };
    case "slug_taken":
      return {
        ok: false,
        message: "A project with this name already exists.",
        errors: { name: `Already used by /projects/${error.slug}. Choose a different name or edit that project.` },
      };
    case "not_found":
      return { ok: false, message: "This project was deleted while you were editing it.", errors: {} };
  }
}

export async function createProjectAction(raw: unknown): Promise<ProjectActionResult> {
  const user = await requireRole("editor");
  const values = projectFormValuesSchema.safeParse(raw);
  if (!values.success) return MALFORMED;

  const result = await createProject(toProjectInput(values.data, toSlug(values.data.name)), user.id);
  return result.ok ? { ok: true, slug: result.value.slug } : toActionError(result.error);
}

export async function updateProjectAction(id: unknown, slug: unknown, raw: unknown): Promise<ProjectActionResult> {
  const user = await requireRole("editor");
  const ids = z.object({ id: idSchema, slug: slugSchema }).safeParse({ id, slug });
  const values = projectFormValuesSchema.safeParse(raw);
  if (!ids.success || !values.success) return MALFORMED;

  const result = await updateProject(ids.data.id, toProjectInput(values.data, ids.data.slug), {
    actor: user.id,
    slug: ids.data.slug,
  });
  return result.ok ? { ok: true, slug: result.value.slug } : toActionError(result.error);
}

export interface FormPerson {
  id: string;
  name: string;
  roles: z.infer<typeof personRoleSchema>[];
  active: boolean;
}

export type PersonActionResult =
  | { ok: true; person: FormPerson; existed: boolean }
  | { ok: false; message: string };

const newPersonSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  roles: z.array(personRoleSchema).min(1, "Pick a role."),
});

/** Adds a person inline from the form; an existing match is returned so the form can select them. */
export async function createPersonAction(raw: unknown): Promise<PersonActionResult> {
  const user = await requireRole("editor");
  const input = newPersonSchema.safeParse(raw);
  if (!input.success) return { ok: false, message: input.error.issues[0]?.message ?? "Check the name and role." };

  const result = await createPerson(input.data, user.id);
  if (result.ok) return { ok: true, person: pickPerson(result.value), existed: false };
  if (result.error.kind === "person_exists" && result.error.person) {
    return { ok: true, person: pickPerson(result.error.person), existed: true };
  }
  return { ok: false, message: "That name can't be used. Check it and try again." };
}

function pickPerson({ id, name, roles, active }: FormPerson): FormPerson {
  return { id, name, roles, active };
}
