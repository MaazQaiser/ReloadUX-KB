import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyFormValues } from "@/lib/project-form";
import type { Project } from "@/schemas/project";
import type { User } from "@/schemas/user";
import * as auth from "@/server/auth";
import * as peopleService from "@/server/services/people";
import * as projectsService from "@/server/services/projects";
import { createPersonAction, createProjectAction, updateProjectAction } from "./actions";

vi.mock("@/server/auth");
vi.mock("@/server/services/people");
vi.mock("@/server/services/projects");

const EDITOR = { id: "64b7f0c2a1b2c3d4e5f60799", role: "editor" } as User;
const PROJECT_ID = "64b7f0c2a1b2c3d4e5f60720";
const values = { ...emptyFormValues(), name: "Calmly Care", industry: "healthcare" as const, summary: "x" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth.requireRole).mockResolvedValue(EDITOR);
});

describe("createProjectAction", () => {
  it("requires the editor role before anything else", async () => {
    vi.mocked(auth.requireRole).mockRejectedValue(new Error("redirect:/forbidden"));
    await expect(createProjectAction(values)).rejects.toThrow("redirect:/forbidden");
    expect(auth.requireRole).toHaveBeenCalledWith("editor");
    expect(projectsService.createProject).not.toHaveBeenCalled();
  });

  it("refuses malformed input", async () => {
    expect(await createProjectAction({ name: 42 })).toMatchObject({ ok: false, errors: {} });
    expect(projectsService.createProject).not.toHaveBeenCalled();
  });

  it("derives the slug from the name and saves as the signed-in user", async () => {
    vi.mocked(projectsService.createProject).mockResolvedValue({ ok: true, value: { slug: "calmly-care" } as Project });

    expect(await createProjectAction(values)).toEqual({ ok: true, slug: "calmly-care" });
    expect(projectsService.createProject).toHaveBeenCalledWith(expect.objectContaining({ slug: "calmly-care" }), EDITOR.id);
  });

  it("reports slug problems on the name field", async () => {
    vi.mocked(projectsService.createProject).mockResolvedValue({
      ok: false,
      error: { kind: "invalid", issues: [{ path: "slug", message: "bad" }, { path: "summary", message: "required" }] },
    });

    expect(await createProjectAction(values)).toMatchObject({ ok: false, errors: { name: "bad", summary: "required" } });
  });

  it("explains a taken name", async () => {
    vi.mocked(projectsService.createProject).mockResolvedValue({
      ok: false,
      error: { kind: "slug_taken", slug: "calmly-care" },
    });

    const result = await createProjectAction(values);
    expect(result.ok === false && result.errors.name).toContain("/projects/calmly-care");
  });
});

describe("updateProjectAction", () => {
  it("refuses a malformed id or slug", async () => {
    expect((await updateProjectAction("nope", "calmly-care", values)).ok).toBe(false);
    expect((await updateProjectAction(PROJECT_ID, "Bad Slug", values)).ok).toBe(false);
    expect(projectsService.updateProject).not.toHaveBeenCalled();
  });

  it("saves with the given slug as the signed-in user", async () => {
    vi.mocked(projectsService.updateProject).mockResolvedValue({ ok: true, value: { slug: "calmly-care" } as Project });

    expect(await updateProjectAction(PROJECT_ID, "calmly-care", { ...values, name: "Renamed" })).toEqual({
      ok: true,
      slug: "calmly-care",
    });
    expect(projectsService.updateProject).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({ name: "Renamed", slug: "calmly-care" }),
      { actor: EDITOR.id, slug: "calmly-care" },
    );
  });

  it("explains a project deleted mid-edit", async () => {
    vi.mocked(projectsService.updateProject).mockResolvedValue({ ok: false, error: { kind: "not_found" } });
    expect(await updateProjectAction(PROJECT_ID, "calmly-care", values)).toMatchObject({
      ok: false,
      message: expect.stringContaining("deleted"),
    });
  });
});

describe("createPersonAction", () => {
  const sara = {
    id: "64b7f0c2a1b2c3d4e5f60718",
    name: "Sara Malik",
    slug: "sara-malik",
    roles: ["designer" as const],
    active: true,
    updated_by: "system:test",
    updated_at: new Date(),
    email: "sara@example.com",
  };

  it("requires an editor and a name", async () => {
    expect(await createPersonAction({ name: " ", roles: ["designer"] })).toEqual({ ok: false, message: "Enter a name." });
    expect(auth.requireRole).toHaveBeenCalledWith("editor");
  });

  it("returns only the fields the form needs", async () => {
    vi.mocked(peopleService.createPerson).mockResolvedValue({ ok: true, value: sara });

    expect(await createPersonAction({ name: "Sara Malik", roles: ["designer"] })).toEqual({
      ok: true,
      existed: false,
      person: { id: sara.id, name: "Sara Malik", roles: ["designer"], active: true },
    });
  });

  it("hands back an existing person to select", async () => {
    vi.mocked(peopleService.createPerson).mockResolvedValue({ ok: false, error: { kind: "person_exists", person: sara } });

    expect(await createPersonAction({ name: "sara malik", roles: ["designer"] })).toMatchObject({ ok: true, existed: true });
  });
});
