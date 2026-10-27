import { describe, expect, it } from "vitest";
import { projectInputSchema } from "@/schemas/project";
import { buildSearchText } from "./search-text";
import { builtInCatalog } from "./tag-catalog";

const catalog = builtInCatalog();

const project = projectInputSchema.parse({
  name: "Calmly Care",
  slug: "calmly-care",
  client_name: "Calmly Health",
  industry: "healthcare",
  status: "delivered",
  product_types: ["mobile_app_ios"],
  ai_features: ["chatbot", "conversational_ai"],
  flows: ["content_creation"],
  business_model: ["b2c"],
  personas: ["Patient booking therapy"],
  lead_designer: "64b7f0c2a1b2c3d4e5f60718",
  summary: "A patient app.",
  metrics: [{ label: "Intake completion", value: "+38%" }],
  live_url: [{ label: "App", url: "https://example.com/secret-path" }],
});

describe("buildSearchText", () => {
  const text = buildSearchText(project, ["Sara Malik"], catalog);

  it("uses tag labels people search for, not stored keys", () => {
    expect(text).toContain("healthcare");
    expect(text).toContain("mobile app iOS");
    expect(text).toContain("conversational AI");
    expect(text).toContain("posting / content creation");
    expect(text).toContain("B2C");
    expect(text).not.toContain("mobile_app_ios");
  });

  it("includes names, people, story text and metrics", () => {
    for (const expected of ["Calmly Care", "Calmly Health", "Sara Malik", "A patient app.", "Intake completion +38%", "Patient booking therapy"]) {
      expect(text).toContain(expected);
    }
  });

  it("leaves out links and the 'none' AI feature", () => {
    expect(text).not.toContain("example.com");
    const plain = buildSearchText({ ...project, ai_features: ["none"] }, [], catalog);
    expect(plain.split("\n")).not.toContain("none");
  });

  it("skips empty optional fields", () => {
    expect(text).not.toMatch(/\n\n/);
  });
});
