import { beforeAll, describe, expect, it } from "vitest";
import type { User } from "@/schemas/user";
import { createLogger } from "@/server/logger";
import { getProjectDetail, saveProject } from "@/server/services/projects";
import { addTagValue, getTagCatalog } from "@/server/services/tags";
import { seedDatabase } from "../../scripts/seed/run";
import { resetDatabase } from "./database";

const admin = { id: "64b7f0c2a1b2c3d4e5f60799", role: "admin" } as User;

beforeAll(async () => {
  await resetDatabase();
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

describe("tag catalog", () => {
  it("adds a value once and refuses duplicates by key or label", async () => {
    expect(await addTagValue(admin, "flows", "  KYC  ")).toEqual({ ok: true, value: { key: "kyc", label: "KYC" } });
    expect(await addTagValue(admin, "flows", "kyc")).toEqual({ ok: false, error: "already_exists" });
    expect(await addTagValue(admin, "flows", "Onboarding")).toEqual({ ok: false, error: "already_exists" });
    expect(await addTagValue(admin, "flows", "!")).toEqual({ ok: false, error: "invalid_label" });
  });

  it("lets projects use added values, and searches by their label", async () => {
    const catalog = await getTagCatalog();
    expect(catalog.flows.added).toEqual(["kyc"]);

    const { project } = (await getProjectDetail("ledgerly"))!;
    const saved = await saveProject({ ...project, flows: [...project.flows, "kyc"] }, { actor: "system:test", reviewStatus: "approved" });

    expect(saved.ok).toBe(true);
    expect(saved.ok && saved.value.search_text).toContain("KYC");
    const refused = await saveProject({ ...project, flows: ["made_up"] }, { actor: "system:test", reviewStatus: "approved" });
    expect(refused.ok).toBe(false);
  });
});
