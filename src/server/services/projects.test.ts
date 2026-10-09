import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "@/schemas/person";
import type { Project, ProjectInput } from "@/schemas/project";
import * as peopleRepository from "@/server/repositories/people";
import * as projectsRepository from "@/server/repositories/projects";
import { getGridFilterOptions, getProjectDetail, listProjectsForGrid, saveProject } from "./projects";

vi.mock("@/server/repositories/people");
vi.mock("@/server/repositories/projects");

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
      OPTIONS,
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
