import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { people, projects } from "@/server/db/schema";
import { createLogger } from "@/server/logger";
import { getProjectDetail } from "@/server/services/projects";
import { SEED_PEOPLE, SEED_PROJECTS } from "../../scripts/seed/data";
import { seedDatabase } from "../../scripts/seed/run";
import { resetDatabase } from "./database";

const log = createLogger({ level: "error", write: () => {} });

async function counts() {
  const db = await getDb();
  return {
    people: await db.$count(people),
    projects: await db.$count(projects),
  };
}

beforeEach(async () => {
  await resetDatabase();
});

describe("seedDatabase", () => {
  it("writes nothing on a dry run", async () => {
    expect(await seedDatabase({ dryRun: true, log })).toMatchObject({ dryRun: true });
    expect(await counts()).toEqual({ people: 0, projects: 0 });
  });

  it("seeds every person and project, with people linked by id", async () => {
    await seedDatabase({ dryRun: false, log });

    expect(await counts()).toEqual({ people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length });
    const detail = await getProjectDetail("calmly-care");
    expect(detail?.people.lead_designer?.slug).toBe("sara-malik");
    expect(detail?.people.designers.map((person) => person.slug)).toEqual(["hamza-tariq"]);
    expect(detail?.people.account_manager?.slug).toBe("zara-iqbal");
  });

  it("is safe to run twice", async () => {
    await seedDatabase({ dryRun: false, log });
    const firstId = (await getProjectDetail("ledgerly"))?.project.id;
    await seedDatabase({ dryRun: false, log });

    expect(await counts()).toEqual({ people: SEED_PEOPLE.length, projects: SEED_PROJECTS.length });
    expect((await getProjectDetail("ledgerly"))?.project.id).toBe(firstId);
  });
});
