import { beforeAll, describe, expect, it, vi } from "vitest";
import { builtInCatalog } from "@/lib/tag-catalog";
import type { User } from "@/schemas/user";
import { AGENT_TOOLS, runTool, toToolDefinition } from "@/server/agent/tools";
import type { ToolContext } from "@/server/agent/tools/types";
import { getDb } from "@/server/db/client";
import { COLLECTIONS } from "@/server/db/collections";
import { syncIndexes } from "@/server/db/indexes";
import { createLogger } from "@/server/logger";
import { insertVerifiedAnswer } from "@/server/repositories/verified-answers";
import { seedDatabase } from "../../scripts/seed/run";

// No Voyage key: search runs on keywords and verified answers on shared words, so results are exact.
vi.mock("@/env", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/env")>()), getAiConfig: () => ({}) }));

const user = { id: "64b7f0c2a1b2c3d4e5f60799", role: "viewer" } as User;
const context = (question = "test question"): ToolContext => ({
  user,
  turnId: "4b0e9a0e-5f2d-4c61-9d64-0a1f3c2b7e11",
  question,
  catalog: builtInCatalog(),
});

async function run(name: string, input: unknown) {
  const result = await runTool(name, input, context());
  if (!result.ok) throw new Error(result.error);
  return result.output;
}

beforeAll(async () => {
  const db = await getDb();
  await db.dropDatabase();
  await syncIndexes(db, { dryRun: false });
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

describe("tool definitions", () => {
  it("give every tool a JSON object schema and a model-facing description", () => {
    for (const tool of AGENT_TOOLS) {
      const definition = toToolDefinition(tool);
      expect(definition.input_schema.type).toBe("object");
      expect(definition.input_schema).not.toHaveProperty("$schema");
      expect(definition.description?.length).toBeGreaterThan(80);
    }
  });
});

describe("runTool", () => {
  it("rejects unknown tools and invalid input without throwing", async () => {
    expect(await runTool("drop_database", {}, context())).toMatchObject({ ok: false });
    expect(await runTool("search_projects", { query: "" }, context())).toMatchObject({ ok: false, error: expect.stringContaining("query") });
  });
});

describe("search_projects", () => {
  it("returns cited projects with scores and reasons", async () => {
    const output = await run("search_projects", { query: "healthcare chatbot" });
    expect(output.projectSlugs[0]).toBe("calmly-care");
    expect(output.content).toMatchObject({ results: [{ slug: "calmly-care", industry: "healthcare", why: { keyword: true } }] });
  });
});

describe("get_project", () => {
  it("finds a project by slug or by name and returns the full record", async () => {
    for (const project of ["calmly-care", "Calmly Care"]) {
      const output = await run("get_project", { project });
      expect(output.projectSlugs).toEqual(["calmly-care"]);
      expect(output.content).toMatchObject({
        project: { name: "Calmly Care", lead_designer: "Sara Malik", business_model: ["B2C"], start_date: "2024-11-04", links: { figma: [{ label: "Main file" }] } },
      });
    }
  });

  it("says when nothing matches instead of inventing one", async () => {
    const output = await run("get_project", { project: "Nonexistent Moonbase" });
    expect(output.content).toMatchObject({ project: null, candidates: [] });
    expect(output.projectSlugs).toEqual([]);
  });
});

describe("list_projects", () => {
  it("counts by tag and designer", async () => {
    const fintech = await run("list_projects", { industry: "fintech" });
    expect(fintech.content).toMatchObject({ total: 1, projects: [{ slug: "ledgerly" }] });

    const sara = await run("list_projects", { designer: "sara" });
    expect((sara.content as { total: number }).total).toBeGreaterThan(0);
    expect(sara.projectSlugs).toContain("calmly-care");
  });

  it("explains an unknown designer rather than returning everything", async () => {
    const output = await run("list_projects", { designer: "Nobody Here" });
    expect(output.content).toMatchObject({ total: 0, note: expect.stringContaining("No designer") });
  });
});

describe("get_verified_answer", () => {
  it("offers an approved answer only for a near-identical question", async () => {
    expect((await run("get_verified_answer", { question: "Have we built a VR game?" })).content).toEqual({ match: null });
    await insertVerifiedAnswer({ question: "Have we built a VR game?", answer: "No. Closest is Questline.", project_slugs: ["questline"] }, "system:test");
    const output = await run("get_verified_answer", { question: "have we built a VR game" });
    expect(output.content).toMatchObject({ match: { answer: "No. Closest is Questline." } });
    expect(output.projectSlugs).toEqual(["questline"]);
    expect((await run("get_verified_answer", { question: "Who designed Ledgerly?" })).content).toEqual({ match: null });
  });
});

describe("log_gap", () => {
  it("records the question for the review queue", async () => {
    const result = await runTool("log_gap", { reason: "not_recorded", note: "No delivery date for Questline" }, context("When was Questline delivered?"));
    expect(result).toMatchObject({ ok: true });
    const gap = await (await getDb()).collection(COLLECTIONS.knowledgeGaps).findOne({ note: "No delivery date for Questline" });
    expect(gap).toMatchObject({ question: "When was Questline delivered?", reason: "not_recorded", status: "open" });
  });
});

describe("find_visuals", () => {
  it("returns nothing, not an error, when no screens are uploaded", async () => {
    expect((await run("find_visuals", { query: "onboarding" })).content).toEqual({ visuals: [] });
  });
});
