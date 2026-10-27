import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { builtInCatalog } from "@/lib/tag-catalog";
import { getDb } from "@/server/db/client";
import { projectChunks } from "@/server/db/schema";
import { createLogger } from "@/server/logger";
import { findSimilarChunks } from "@/server/repositories/project-chunks";
import { indexProject } from "@/server/services/project-index";
import { getProjectDetail } from "@/server/services/projects";
import { seedDatabase } from "../../scripts/seed/run";
import { resetDatabase } from "./database";

// A 1024-dimension vector that leans towards one of a few topics, so similarity is predictable.
const TOPICS = ["chatbot", "budget", "hr", "game"] as const;
function topicVector(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = Array.from({ length: 1024 }, () => 0.001);
  TOPICS.forEach((topic, index) => {
    if (lower.includes(topic)) vector[index] = 1;
  });
  return vector;
}

const embed = vi.hoisted(() => vi.fn(async (texts: readonly string[]) => texts.map((text) => topicVector(text))));
vi.mock("@/server/ai/voyage", () => ({ embed }));
vi.mock("@/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/env")>()),
  getAiConfig: () => ({ voyageApiKey: "test-voyage-key-0123456789" }),
}));

beforeAll(async () => {
  await resetDatabase();
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

beforeEach(async () => {
  embed.mockClear();
  // Seeding already indexed every project; start each test from no chunks.
  await (await getDb()).delete(projectChunks);
});

describe("indexProject", () => {
  it("stores chunks on save and reuses vectors for unchanged text", async () => {
    const project = (await getProjectDetail("calmly-care"))!.project;
    const first = await indexProject(project, builtInCatalog());
    expect(first).toMatchObject({ status: "indexed" });
    if (first.status !== "indexed") throw new Error("expected indexing");
    expect(first.chunks).toBeGreaterThan(1);

    expect(await indexProject(project, builtInCatalog())).toMatchObject({ status: "indexed", embedded: 0 });
    expect(embed).toHaveBeenCalledTimes(1);

    const edited = await indexProject({ ...project, outcomes: "Intake completion rose by a third." }, builtInCatalog());
    expect(edited).toMatchObject({ status: "indexed", embedded: 1 });
    const stored = await (await getDb()).$count(projectChunks);
    expect(stored).toBe(first.chunks);
  });

  it("reports a failure instead of throwing, so the save itself still succeeds", async () => {
    embed.mockRejectedValueOnce(new Error("Voyage is down"));
    const project = (await getProjectDetail("ledgerly"))!.project;
    expect(await indexProject({ ...project, summary: "Changed summary." }, builtInCatalog())).toEqual({ status: "failed" });
  });
});

describe("findSimilarChunks", () => {
  it("ranks the closest chunks first by cosine distance", async () => {
    const project = (await getProjectDetail("calmly-care"))!.project;
    await indexProject(project, builtInCatalog());
    const matches = await findSimilarChunks(topicVector("chatbot"), 3);
    expect(matches[0]).toMatchObject({ projectId: project.id });
    expect(matches[0]?.text).toMatch(/chatbot/i);
    for (let i = 1; i < matches.length; i++) expect(matches[i - 1]!.score).toBeGreaterThanOrEqual(matches[i]!.score);
  });
});
