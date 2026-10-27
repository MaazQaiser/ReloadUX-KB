import { beforeAll, describe, expect, it } from "vitest";
import { createLogger } from "@/server/logger";
import { getProjectBrief } from "@/server/services/project-brief";
import { seedDatabase } from "../../scripts/seed/run";
import { resetDatabase } from "./database";

beforeAll(async () => {
  await resetDatabase();
  await seedDatabase({ dryRun: false, log: createLogger({ level: "error", write: () => {} }) });
});

describe("getProjectBrief", () => {
  it("returns the record with tags and people as display names", async () => {
    const brief = await getProjectBrief("calmly-care");

    expect(brief).toMatchObject({
      name: "Calmly Care",
      client_name: "Calmly Health (fictional)",
      nda: true,
      industry: "healthcare",
      status: "delivered",
      product_types: ["web app", "cross-platform app"],
      ai_features: ["chatbot", "conversational AI"],
      business_model: ["B2C"],
      personas: ["Patient looking for therapy", "Clinic intake coordinator"],
      lead_designer: "Sara Malik",
      designers: ["Hamza Tariq"],
      account_manager: "Zara Iqbal",
      delivered_to: "Dana Lee, Head of Product",
      duration_weeks: 19,
      screens: [],
    });
    expect(brief?.start_date).toEqual(new Date("2024-11-04"));
    expect(brief?.links.map(({ group }) => group)).toEqual(["Figma", "Prototype", "Live"]);
  });

  it("returns null for a project that isn't in the library", async () => {
    expect(await getProjectBrief("no-such-project")).toBeNull();
  });
});
