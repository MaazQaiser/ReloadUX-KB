import { ObjectId } from "mongodb";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { syncIndexes } from "@/server/db/indexes";
import {
  findProjectBySlug,
  insertProject,
  listAllMatchingProjects,
  listDeliveryYears,
  listProjects,
  softDeleteProjectById,
  updateProjectById,
  upsertProjectBySlug,
} from "@/server/repositories/projects";
import type { ProjectInput } from "@/schemas/project";
import type { ProjectFilters } from "@/schemas/project-filters";

const SEED = { actor: "system:seed", reviewStatus: "approved", searchText: "seed text" } as const;
const SARA = "64b7f0c2a1b2c3d4e5f60718";
const ALI = "64b7f0c2a1b2c3d4e5f60719";
const PAGE = { page: 1, page_size: 24 };

function project(overrides: Partial<ProjectInput> & Pick<ProjectInput, "name" | "slug">): ProjectInput {
  return {
    industry: "healthcare",
    status: "delivered",
    product_types: ["web_app"],
    lead_designer: SARA,
    summary: "A project.",
    ...overrides,
  };
}

const elia = project({
  name: "Elia Wellness",
  slug: "elia-wellness",
  client_name: "Elia Health (US)",
  ai_features: ["chatbot"],
  flows: ["onboarding"],
  delivery_date: new Date("2025-04-18"),
});
const fintua = project({
  name: "Fintua Onboarding",
  slug: "fintua-onboarding",
  industry: "fintech",
  product_types: ["mobile_app_ios", "mobile_app_android"],
  lead_designer: ALI,
  designers: [SARA],
  flows: ["onboarding", "signup"],
  delivery_date: new Date("2024-11-02"),
});
const ledger = project({ name: "ledger HRMS", slug: "ledger-hrms", industry: "hr", lead_designer: ALI, status: "ongoing" });

async function collection() {
  return (await getDb()).collection(COLLECTIONS.projects);
}

async function slugs(filters: ProjectFilters): Promise<string[]> {
  return (await listProjects(filters, PAGE)).items.map((item) => item.slug);
}

beforeAll(async () => {
  await syncIndexes(await getDb(), { dryRun: false });
});

beforeEach(async () => {
  await (await collection()).deleteMany({});
});

describe("upsertProjectBySlug", () => {
  it("creates a project with defaults, audit fields and string ids", async () => {
    const saved = await upsertProjectBySlug(elia, SEED);

    expect(saved).toMatchObject({
      slug: "elia-wellness",
      lead_designer: SARA,
      designers: [],
      nda: false,
      review_status: "approved",
      updated_by: "system:seed",
      search_text: "seed text",
    });
    expect(saved.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it("stores people references as ObjectIds", async () => {
    await upsertProjectBySlug(fintua, SEED);
    const raw = await (await collection()).findOne({ slug: "fintua-onboarding" });

    expect(raw?.lead_designer).toBeInstanceOf(ObjectId);
    expect(raw?.designers[0]).toBeInstanceOf(ObjectId);
  });

  it("updates in place when run again and clears optional fields left out", async () => {
    const first = await upsertProjectBySlug(elia, SEED);
    const second = await upsertProjectBySlug({ ...elia, client_name: undefined, name: "Elia Wellness v2" }, SEED);

    expect(second.id).toBe(first.id);
    expect(second.name).toBe("Elia Wellness v2");
    expect(second).not.toHaveProperty("client_name");
    expect(await (await collection()).countDocuments()).toBe(1);
    expect(await (await collection()).findOne({ slug: elia.slug })).not.toHaveProperty("client_name");
  });

  it("validates before writing", async () => {
    await expect(upsertProjectBySlug({ ...elia, product_types: [] }, SEED)).rejects.toThrow();
    await expect(upsertProjectBySlug(elia, { ...SEED, actor: "nobody" })).rejects.toThrow();
    expect(await (await collection()).countDocuments()).toBe(0);
  });
});

describe("visibility", () => {
  it("hides drafts and soft-deleted projects from reads", async () => {
    await upsertProjectBySlug(elia, { ...SEED, reviewStatus: "draft" });
    await upsertProjectBySlug(fintua, SEED);
    await (await collection()).updateOne({ slug: fintua.slug }, { $set: { deleted_at: new Date() } });

    expect(await findProjectBySlug("elia-wellness")).toBeNull();
    expect(await findProjectBySlug("fintua-onboarding")).toBeNull();
    expect(await listProjects({}, PAGE)).toEqual({ items: [], total: 0 });
    expect(await listDeliveryYears()).toEqual([]);
  });

  it("finds a visible project by slug", async () => {
    await upsertProjectBySlug(elia, SEED);
    expect(await findProjectBySlug("elia-wellness")).toMatchObject({ name: "Elia Wellness" });
  });
});

describe("listProjects", () => {
  beforeEach(async () => {
    for (const item of [elia, fintua, ledger]) await upsertProjectBySlug(item, SEED);
  });

  it("sorts newest delivery first, undated last", async () => {
    expect(await slugs({})).toEqual(["elia-wellness", "fintua-onboarding", "ledger-hrms"]);
  });

  it("matches name or client, case-insensitively and literally", async () => {
    expect(await slugs({ q: "HRMS" })).toEqual(["ledger-hrms"]);
    expect(await slugs({ q: "health (us)" })).toEqual(["elia-wellness"]);
    expect(await slugs({ q: ".*" })).toEqual([]);
  });

  it("filters by each tag field", async () => {
    expect(await slugs({ industry: "fintech" })).toEqual(["fintua-onboarding"]);
    expect(await slugs({ product_type: "mobile_app_ios" })).toEqual(["fintua-onboarding"]);
    expect(await slugs({ ai_feature: "chatbot" })).toEqual(["elia-wellness"]);
    expect(await slugs({ flow: "onboarding" })).toEqual(["elia-wellness", "fintua-onboarding"]);
  });

  it("filters by designer as lead or team member", async () => {
    expect(await slugs({ designer: SARA })).toEqual(["elia-wellness", "fintua-onboarding"]);
    expect(await slugs({ designer: ALI })).toEqual(["fintua-onboarding", "ledger-hrms"]);
  });

  it("filters by delivery year in UTC", async () => {
    expect(await slugs({ year: 2025 })).toEqual(["elia-wellness"]);
    expect(await slugs({ year: 2023 })).toEqual([]);
  });

  it("combines filters with AND", async () => {
    expect(await slugs({ flow: "onboarding", designer: ALI })).toEqual(["fintua-onboarding"]);
    expect(await slugs({ q: "elia", industry: "fintech" })).toEqual([]);
  });

  it("paginates and reports the total", async () => {
    const pageTwo = await listProjects({}, { page: 2, page_size: 2 });
    expect(pageTwo.total).toBe(3);
    expect(pageTwo.items.map((item) => item.slug)).toEqual(["ledger-hrms"]);
  });

  it("lists delivery years newest first", async () => {
    expect(await listDeliveryYears()).toEqual([2025, 2024]);
  });
});

describe("insertProject", () => {
  it("inserts a new project and refuses a taken slug, even a draft's", async () => {
    const created = await insertProject(elia, SEED);
    expect(created).toMatchObject({ slug: "elia-wellness", search_text: "seed text" });

    expect(await insertProject({ ...elia, name: "Other" }, SEED)).toBeNull();
    await upsertProjectBySlug(fintua, { ...SEED, reviewStatus: "draft" });
    expect(await insertProject(fintua, SEED)).toBeNull();
    expect((await findProjectBySlug("elia-wellness"))?.name).toBe("Elia Wellness");
  });
});

describe("updateProjectById", () => {
  it("updates in place and clears removed fields", async () => {
    const created = await insertProject(elia, SEED);
    if (!created) throw new Error("insert failed");

    const updated = await updateProjectById(created.id, { ...elia, client_name: undefined, name: "Elia 2" }, SEED);

    expect(updated).toMatchObject({ id: created.id, name: "Elia 2" });
    expect(updated).not.toHaveProperty("client_name");
  });

  it("returns null for a soft-deleted or missing project, and never changes the slug", async () => {
    const created = await insertProject(elia, SEED);
    if (!created) throw new Error("insert failed");

    expect(await updateProjectById(created.id, { ...elia, slug: "new-slug" }, SEED)).toBeNull();
    await (await collection()).updateOne({ slug: elia.slug }, { $set: { deleted_at: new Date() } });
    expect(await updateProjectById(created.id, elia, SEED)).toBeNull();
    expect(await updateProjectById("64b7f0c2a1b2c3d4e5f60799", elia, SEED)).toBeNull();
  });
});

describe("findProjectBySlug with drafts", () => {
  it("finds drafts only when asked", async () => {
    await upsertProjectBySlug(elia, { ...SEED, reviewStatus: "draft" });

    expect(await findProjectBySlug("elia-wellness")).toBeNull();
    expect(await findProjectBySlug("elia-wellness", { includeDrafts: true })).toMatchObject({ review_status: "draft" });
  });
});

describe("drafts and soft delete", () => {
  const DRAFT = { ...SEED, reviewStatus: "draft" } as const;

  it("lists drafts only when asked, and never alongside approved projects", async () => {
    await upsertProjectBySlug(elia, SEED);
    await upsertProjectBySlug(fintua, DRAFT);

    expect(await slugs({})).toEqual(["elia-wellness"]);
    expect(await slugs({ review: "approved" })).toEqual(["elia-wellness"]);
    expect(await slugs({ review: "draft" })).toEqual(["fintua-onboarding"]);
  });

  it("hides a soft-deleted project everywhere but keeps the record", async () => {
    const saved = await upsertProjectBySlug(elia, SEED);
    await upsertProjectBySlug(ledger, SEED);

    const deleted = await softDeleteProjectById(saved.id, "system:test");

    expect(deleted?.deleted_at).toBeInstanceOf(Date);
    expect(deleted?.updated_by).toBe("system:test");
    expect(await slugs({})).toEqual(["ledger-hrms"]);
    expect(await findProjectBySlug("elia-wellness", { includeDrafts: true })).toBeNull();
    expect(await (await collection()).countDocuments({ slug: "elia-wellness" })).toBe(1);
    expect(await softDeleteProjectById(saved.id, "system:test")).toBeNull();
  });

  it("returns every match unpaged for in-memory sorting", async () => {
    await upsertProjectBySlug(elia, SEED);
    await upsertProjectBySlug(fintua, SEED);
    await upsertProjectBySlug(ledger, SEED);

    const all = await listAllMatchingProjects({ flow: "onboarding" });
    expect(all.map((item) => item.slug)).toEqual(["elia-wellness", "fintua-onboarding"]);
  });
});
