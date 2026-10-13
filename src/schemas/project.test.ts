import { describe, expect, it } from "vitest";
import { projectInputSchema, projectSchema } from "./project";

const SARA = "64b7f0c2a1b2c3d4e5f60718";
const ALI = "64b7f0c2a1b2c3d4e5f60719";

const minimal = {
  name: "Elia Wellness",
  slug: "elia-wellness",
  industry: "healthcare",
  status: "delivered",
  product_types: ["web_app"],
  lead_designer: SARA,
  summary: "Patient onboarding and care plans for a wellness clinic.",
};

describe("projectInputSchema", () => {
  it("accepts the required fields alone and fills list defaults", () => {
    expect(projectInputSchema.parse(minimal)).toEqual({
      ...minimal,
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
    });
  });

  it.each(["name", "slug", "industry", "status", "product_types", "lead_designer", "summary"])(
    "requires %s",
    (field) => {
      const withoutField = Object.fromEntries(Object.entries(minimal).filter(([key]) => key !== field));
      expect(projectInputSchema.safeParse(withoutField).success).toBe(false);
    },
  );

  it("refuses slugs that collide with routes", () => {
    expect(projectInputSchema.safeParse({ ...minimal, slug: "new" }).success).toBe(false);
  });

  it("needs at least one product type", () => {
    expect(projectInputSchema.safeParse({ ...minimal, product_types: [] }).success).toBe(false);
  });

  it("rejects labels or unknown values in tag fields", () => {
    expect(projectInputSchema.safeParse({ ...minimal, industry: "Healthcare" }).success).toBe(false);
    expect(projectInputSchema.safeParse({ ...minimal, flows: ["onboarding", "KYC flow"] }).success).toBe(false);
  });

  it("accepts a fully filled project", () => {
    const full = {
      ...minimal,
      client_name: "Elia Health Inc.",
      country: "USA",
      nda: true,
      services: ["research", "ux_ui_design"],
      ai_features: ["chatbot"],
      flows: ["onboarding", "booking"],
      designers: [ALI],
      account_manager: ALI,
      delivered_to: { name: "Dana Lee", role: "Head of Product" },
      start_date: new Date("2025-01-06"),
      delivery_date: new Date("2025-04-18"),
      duration_weeks: 15,
      milestones: [{ name: "Design sign-off", date: new Date("2025-03-28") }],
      figma_files: [{ label: "Main file", url: "https://www.figma.com/design/abc/Elia" }],
      prototype_url: [{ label: "Clickable prototype", url: "https://www.figma.com/proto/abc/Elia" }],
      live_url: [{ label: "App", url: "https://app.elia.example.com" }],
      case_study_url: [{ label: "Case study", url: "https://reloadux.com/case-studies/elia" }],
      drive_folder: [{ label: "Finals", url: "https://drive.google.com/drive/folders/xyz" }],
      challenge: "Drop-off during intake.",
      what_we_did: "Rebuilt intake as a guided flow.",
      outcomes: "Completion up.",
      testimonial: "Great partner.",
      metrics: [{ label: "Intake completion", value: "+38%" }],
      public_summary: "A healthcare platform for guided patient intake.",
    };
    expect(projectInputSchema.parse(full)).toMatchObject(full);
  });

  it("rejects a delivery date before the start date", () => {
    const result = projectInputSchema.safeParse({
      ...minimal,
      start_date: new Date("2025-05-01"),
      delivery_date: new Date("2025-04-01"),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["delivery_date"]);
  });

  it("rejects repeated designers and non-positive durations", () => {
    expect(projectInputSchema.safeParse({ ...minimal, designers: [ALI, ALI] }).success).toBe(false);
    expect(projectInputSchema.safeParse({ ...minimal, duration_weeks: 0 }).success).toBe(false);
  });

  it("rejects unsafe links", () => {
    const result = projectInputSchema.safeParse({
      ...minimal,
      live_url: [{ label: "App", url: "javascript:alert(1)" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const stored = {
    ...minimal,
    id: "64b7f0c2a1b2c3d4e5f60720",
    review_status: "approved",
    updated_by: "system:seed",
    updated_at: new Date("2026-10-09T12:00:00Z"),
  };

  it("adds id, review status and audit fields", () => {
    expect(projectSchema.parse(stored)).toMatchObject({ id: stored.id, review_status: "approved" });
  });

  it("keeps the date-order rule", () => {
    const result = projectSchema.safeParse({
      ...stored,
      start_date: new Date("2025-05-01"),
      delivery_date: new Date("2025-04-01"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown review status", () => {
    expect(projectSchema.safeParse({ ...stored, review_status: "published" }).success).toBe(false);
  });
});
