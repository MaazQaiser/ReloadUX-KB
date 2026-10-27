import { describe, expect, it } from "vitest";
import { projectInputSchema } from "@/schemas/project";
import { buildProjectChunks, splitText } from "./chunks";
import { builtInCatalog } from "./tag-catalog";

const project = projectInputSchema.parse({
  name: "Calmly Care",
  slug: "calmly-care",
  client_name: "Calmly Health",
  industry: "healthcare",
  status: "delivered",
  product_types: ["web_app"],
  ai_features: ["chatbot"],
  business_model: ["b2c"],
  personas: ["Patient looking for therapy"],
  lead_designer: "64b7f0c2a1b2c3d4e5f60718",
  summary: "A patient app with a symptom-check chatbot.",
  what_we_did: "Replaced intake forms with a guided chat.",
});

describe("splitText", () => {
  it("keeps short text whole and packs sentences up to the limit", () => {
    expect(splitText("One. Two.", 100)).toEqual(["One. Two."]);
    const long = Array.from({ length: 10 }, (_, index) => `Sentence number ${index} is here.`).join(" ");
    const chunks = splitText(long, 80);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(80);
    expect(chunks.join(" ")).toBe(long);
  });

  it("cuts a single over-long sentence on whitespace", () => {
    const chunks = splitText("word ".repeat(100).trim(), 30);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(30);
  });
});

describe("buildProjectChunks", () => {
  const chunks = buildProjectChunks(project, builtInCatalog(), 3_200);

  it("starts with a profile chunk using labels people search for", () => {
    expect(chunks[0]).toMatchObject({ field: "profile", ordinal: 0 });
    for (const expected of ["Calmly Care for Calmly Health", "healthcare", "web app", "chatbot", "B2C", "Patient looking for therapy", "symptom-check"]) {
      expect(chunks[0]?.text).toContain(expected);
    }
  });

  it("adds story fields with the project and field named, and skips empty ones", () => {
    expect(chunks.slice(1)).toEqual([{ field: "what_we_did", ordinal: 0, text: "Calmly Care, What we did: Replaced intake forms with a guided chat." }]);
  });

  it("leaves the 'none' AI feature out", () => {
    const none = buildProjectChunks({ ...project, ai_features: ["none"] }, builtInCatalog(), 3_200);
    expect(none[0]?.text).not.toContain("AI features");
  });
});
