import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "@/schemas/person";
import type { Project, ProjectInput } from "@/schemas/project";
import * as peopleRepository from "@/server/repositories/people";
import * as projectsRepository from "@/server/repositories/projects";
import {
  createProject,
  deleteProject,
  getGridFilterOptions,
  getProjectDetail,
  getProjectForEdit,
  listProjectsForGrid,
  saveProject,
  updateProject,
} from "./projects";

vi.mock("@/server/repositories/people");
vi.mock("@/server/repositories/projects");
vi.mock("@/server/services/tags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/tags")>()),
  getTagCatalog: async () => (await import("@/lib/tag-catalog")).builtInCatalog(),
}));

const SARA = "64b7f0c2a1b2c3d4e5f60718";
const ALI = "64b7f0c2a1b2c3d4e5f60719";
const OMAR = "64b7f0c2a1b2c3d4e5f6071a";
const AUDIT = { updated_by: "system:seed", updated_at: new Date("2026-10-09") };
const OPTIONS = { actor: "system:seed", reviewStatus: "approved" } as const;

function person(id: string, name: string): Person {
  return { id, name, slug: name.toLowerCase(), roles: ["designer"], active: true, ...AUDIT };
}

const input: ProjectInput = {
  name: "Elia Wellness",
  slug: "elia-wellness",
  industry: "healthcare",
  status: "delivered",
  product_types: ["web_app"],
  lead_designer: SARA,
  designers: [ALI],
  account_manager: OMAR,
  summary: "Patient onboarding.",
};

const stored: Project = {
  ...projectDefaults(),
  ...input,
  industry: "healthcare",
  status: "delivered",
  product_types: ["web_app"],
  designers: [ALI],
  id: "64b7f0c2a1b2c3d4e5f60720",
  review_status: "approved",
  ...AUDIT,
};

function projectDefaults() {
  return {
    nda: false,
    services: [],
    ai_features: [],
    flows: [],
    designers: [],
    milestones: [],
    figma_files: [],
    prototype_url: [],
    live_url: [],
    case_study_url: [],
    drive_folder: [],
    visuals: [],
    metrics: [],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("saveProject", () => {
  it("returns validation issues without touching the database", async () => {
    const result = await saveProject({ ...input, product_types: [] }, OPTIONS);

    expect(result).toEqual({
      ok: false,
      error: { kind: "invalid", issues: [{ path: "product_types", message: "pick at least one product type" }] },
    });
    expect(peopleRepository.findPeopleByIds).not.toHaveBeenCalled();
    expect(projectsRepository.upsertProjectBySlug).not.toHaveBeenCalled();
  });

  it("rejects references to people who don't exist", async () => {
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([person(SARA, "Sara")]);

    const result = await saveProject(input, OPTIONS);

    expect(result).toEqual({ ok: false, error: { kind: "unknown_people", ids: [ALI, OMAR] } });
    expect(projectsRepository.upsertProjectBySlug).not.toHaveBeenCalled();
  });

  it("looks each person up once and saves when all exist", async () => {
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([
      person(SARA, "Sara"),
      person(ALI, "Ali"),
      person(OMAR, "Omar"),
    ]);
    vi.mocked(projectsRepository.upsertProjectBySlug).mockResolvedValue(stored);

    const result = await saveProject({ ...input, designers: [ALI], account_manager: SARA }, OPTIONS);

    expect(peopleRepository.findPeopleByIds).toHaveBeenCalledWith([SARA, ALI]);
    expect(result).toEqual({ ok: true, value: stored });
    expect(projectsRepository.upsertProjectBySlug).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "elia-wellness", nda: false }),
      { ...OPTIONS, searchText: expect.stringContaining("Sara") },
    );
  });
});

describe("getProjectDetail", () => {
  it("returns null for an unknown slug", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(null);
    expect(await getProjectDetail("nope")).toBeNull();
  });

  it("resolves people and computes completeness", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(stored);
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([
      person(SARA, "Sara"),
      person(ALI, "Ali"),
      person(OMAR, "Omar"),
    ]);

    const detail = await getProjectDetail("elia-wellness");

    expect(detail?.people).toEqual({
      lead_designer: person(SARA, "Sara"),
      designers: [person(ALI, "Ali")],
      account_manager: person(OMAR, "Omar"),
    });
    expect(detail?.completeness.missing).not.toContain("designers");
    expect(detail?.completeness.missing).toContain("figma_files");
  });

  it("returns null for people who are missing, so the page shows 'not recorded'", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(stored);
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([]);

    const detail = await getProjectDetail("elia-wellness");

    expect(detail?.people).toEqual({ lead_designer: null, designers: [], account_manager: null });
  });
});

describe("listProjectsForGrid", () => {
  it("attaches lead designers with one lookup and computes the page count", async () => {
    const second = { ...stored, id: "64b7f0c2a1b2c3d4e5f60721", slug: "other", lead_designer: ALI };
    vi.mocked(projectsRepository.listProjects).mockResolvedValue({ items: [stored, second, stored], total: 50 });
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([person(SARA, "Sara")]);

    const page = await listProjectsForGrid({ industry: "healthcare" }, { page: 2, page_size: 24 });

    expect(projectsRepository.listProjects).toHaveBeenCalledWith({ industry: "healthcare" }, { page: 2, page_size: 24 });
    expect(peopleRepository.findPeopleByIds).toHaveBeenCalledTimes(1);
    expect(peopleRepository.findPeopleByIds).toHaveBeenCalledWith([SARA, ALI]);
    expect(page.items.map((item) => item.leadDesigner?.name ?? null)).toEqual(["Sara", null, "Sara"]);
    expect(page).toMatchObject({ total: 50, page: 2, pageCount: 3 });
  });

  it("reports one page when there are no results", async () => {
    vi.mocked(projectsRepository.listProjects).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([]);

    expect(await listProjectsForGrid({}, { page: 1, page_size: 24 })).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 1,
    });
  });
});

describe("getGridFilterOptions", () => {
  it("lists every designer, active or not, and the delivery years", async () => {
    vi.mocked(peopleRepository.listPeople).mockResolvedValue([person(SARA, "Sara")]);
    vi.mocked(projectsRepository.listDeliveryYears).mockResolvedValue([2025, 2024]);

    expect(await getGridFilterOptions()).toEqual({ designers: [person(SARA, "Sara")], years: [2025, 2024] });
    expect(peopleRepository.listPeople).toHaveBeenCalledWith({ role: "designer" });
  });
});

describe("tag values", () => {
  it("refuses well-formed keys that aren't in the tag catalog", async () => {
    const result = await saveProject({ ...input, flows: ["onboarding", "kyc"] }, OPTIONS);
    expect(result).toEqual({
      ok: false,
      error: { kind: "invalid", issues: [{ path: "flows", message: "not a known value: kyc" }] },
    });
    expect(projectsRepository.upsertProjectBySlug).not.toHaveBeenCalled();
  });
});

describe("createProject", () => {
  beforeEach(() => {
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([
      person(SARA, "Sara"),
      person(ALI, "Ali"),
      person(OMAR, "Omar"),
    ]);
  });

  it("inserts as approved, with search text", async () => {
    vi.mocked(projectsRepository.insertProject).mockResolvedValue(stored);

    expect(await createProject(input, "64b7f0c2a1b2c3d4e5f60799")).toEqual({ ok: true, value: stored });
    expect(projectsRepository.insertProject).toHaveBeenCalledWith(expect.objectContaining({ slug: "elia-wellness" }), {
      actor: "64b7f0c2a1b2c3d4e5f60799",
      reviewStatus: "approved",
      searchText: expect.stringContaining("Elia Wellness"),
    });
  });

  it("reports a taken slug", async () => {
    vi.mocked(projectsRepository.insertProject).mockResolvedValue(null);
    expect(await createProject(input, "system:test")).toEqual({
      ok: false,
      error: { kind: "slug_taken", slug: "elia-wellness" },
    });
  });

  it("returns validation issues before touching the database", async () => {
    const result = await createProject({ ...input, summary: "" }, "system:test");
    expect(result.ok === false && result.error.kind).toBe("invalid");
    expect(projectsRepository.insertProject).not.toHaveBeenCalled();
  });
});

describe("updateProject", () => {
  beforeEach(() => {
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([
      person(SARA, "Sara"),
      person(ALI, "Ali"),
      person(OMAR, "Omar"),
    ]);
  });

  it("keeps the stored slug whatever the input says", async () => {
    vi.mocked(projectsRepository.updateProjectById).mockResolvedValue(stored);
    // Extra keys from a tampered request must not change the slug either.
    const tampered = { ...input, slug: "renamed", name: "Renamed" };

    await updateProject(stored.id, tampered, { actor: "system:test", slug: "elia-wellness" });

    expect(projectsRepository.updateProjectById).toHaveBeenCalledWith(
      stored.id,
      expect.objectContaining({ slug: "elia-wellness", name: "Renamed" }),
      expect.objectContaining({ reviewStatus: "approved" }),
    );
  });

  it("reports a project that no longer exists", async () => {
    vi.mocked(projectsRepository.updateProjectById).mockResolvedValue(null);
    expect(await updateProject(stored.id, input, { actor: "system:test", slug: "elia-wellness" })).toEqual({
      ok: false,
      error: { kind: "not_found" },
    });
  });
});

describe("getProjectForEdit", () => {
  it("includes drafts", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(stored);
    await getProjectForEdit("elia-wellness");
    expect(projectsRepository.findProjectBySlug).toHaveBeenCalledWith("elia-wellness", { includeDrafts: true });
  });
});

describe("listProjectsForGrid sorted least complete first", () => {
  it("sorts every match by completeness, then pages in memory", async () => {
    const full = { ...stored, id: "64b7f0c2a1b2c3d4e5f60722", slug: "full", challenge: "Long forms.", outcomes: "Faster intake.", country: "UK" };
    const mid = { ...stored, id: "64b7f0c2a1b2c3d4e5f60723", slug: "mid" };
    const low = { ...stored, id: "64b7f0c2a1b2c3d4e5f60724", slug: "low", designers: [] };
    vi.mocked(projectsRepository.listAllMatchingProjects).mockResolvedValue([full, mid, low]);
    vi.mocked(peopleRepository.findPeopleByIds).mockResolvedValue([]);

    const page = await listProjectsForGrid({ sort: "least_complete" }, { page: 1, page_size: 2 });

    expect(projectsRepository.listProjects).not.toHaveBeenCalled();
    expect(page.items.map((item) => item.project.slug)).toEqual(["low", "mid"]);
    expect(page.items[0]!.completeness.score).toBeLessThan(page.items[1]!.completeness.score);
    expect(page).toMatchObject({ total: 3, pageCount: 2 });
  });
});

describe("deleteProject", () => {
  it("soft-deletes when the typed name matches exactly", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(stored);
    vi.mocked(projectsRepository.softDeleteProjectById).mockResolvedValue({ ...stored, deleted_at: new Date() });

    const result = await deleteProject("elia-wellness", "  Elia Wellness ", "system:test");

    expect(result.ok).toBe(true);
    expect(projectsRepository.findProjectBySlug).toHaveBeenCalledWith("elia-wellness", { includeDrafts: true });
    expect(projectsRepository.softDeleteProjectById).toHaveBeenCalledWith(stored.id, "system:test");
  });

  it("refuses a name that doesn't match, without writing", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(stored);

    expect(await deleteProject("elia-wellness", "elia wellness", "system:test")).toEqual({ ok: false, error: { kind: "name_mismatch" } });
    expect(projectsRepository.softDeleteProjectById).not.toHaveBeenCalled();
  });

  it("reports a project that is already gone", async () => {
    vi.mocked(projectsRepository.findProjectBySlug).mockResolvedValue(null);
    expect(await deleteProject("gone", "Gone", "system:test")).toEqual({ ok: false, error: { kind: "not_found" } });
  });
});
