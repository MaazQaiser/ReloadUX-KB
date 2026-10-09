import { describe, expect, it } from "vitest";
import { COMPLETENESS_FIELDS, getCompleteness } from "./completeness";

const empty = {
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

describe("getCompleteness", () => {
  it("scores 0 and lists every field when only required fields are set", () => {
    expect(getCompleteness(empty)).toEqual({
      score: 0,
      filled: 0,
      total: COMPLETENESS_FIELDS.length,
      missing: [...COMPLETENESS_FIELDS],
    });
  });

  it("counts non-empty values and rounds to a whole percent", () => {
    const result = getCompleteness({
      ...empty,
      client_name: "Elia Health",
      flows: ["onboarding"],
      delivery_date: new Date("2025-04-18"),
    });

    expect(result.filled).toBe(3);
    expect(result.score).toBe(Math.round((3 / COMPLETENESS_FIELDS.length) * 100));
    expect(result.missing).not.toContain("client_name");
    expect(result.missing).toContain("country");
  });

  it("treats blank strings and empty lists as missing", () => {
    const result = getCompleteness({ ...empty, country: "   " });
    expect(result.missing).toContain("country");
    expect(result.missing).toContain("figma_files");
  });

  it("scores 100 when every field is filled", () => {
    const link = [{ label: "x", url: "https://example.com" }];
    const result = getCompleteness({
      client_name: "c",
      country: "c",
      services: ["research"],
      ai_features: ["none"],
      flows: ["signup"],
      designers: ["64b7f0c2a1b2c3d4e5f60719"],
      account_manager: "64b7f0c2a1b2c3d4e5f60719",
      delivered_to: { name: "Dana" },
      start_date: new Date(),
      delivery_date: new Date(),
      duration_weeks: 4,
      milestones: [{ name: "m", date: new Date() }],
      figma_files: link,
      prototype_url: link,
      live_url: link,
      case_study_url: link,
      drive_folder: link,
      visuals: ["64b7f0c2a1b2c3d4e5f60720"],
      challenge: "c",
      what_we_did: "w",
      outcomes: "o",
      testimonial: "t",
      metrics: [{ label: "l", value: "v" }],
      public_summary: "p",
    });
    expect(result).toMatchObject({ score: 100, missing: [] });
  });
});
