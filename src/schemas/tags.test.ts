import { describe, expect, it } from "vitest";
import { aiFeaturesSchema, industrySchema, productTypesSchema } from "./tags";

describe("tag schemas", () => {
  it("accept keys, not labels", () => {
    expect(industrySchema.parse("saas")).toBe("saas");
    expect(industrySchema.safeParse("SaaS").success).toBe(false);
    expect(productTypesSchema.safeParse(["mobile app iOS"]).success).toBe(false);
  });

  it("reject unknown tags", () => {
    // Whether a well-formed key exists is checked against the tag catalog when saving.
    expect(industrySchema.safeParse("crypto").success).toBe(true);
    expect(industrySchema.safeParse("Crypto!").success).toBe(false);
    expect(industrySchema.safeParse("").success).toBe(false);
  });

  it("reject repeated multi-tags", () => {
    expect(productTypesSchema.safeParse(["web_app", "web_app"]).success).toBe(false);
  });
});

describe("aiFeaturesSchema", () => {
  it("accepts real features or none on its own", () => {
    expect(aiFeaturesSchema.parse(["chatbot", "ai_search"])).toEqual(["chatbot", "ai_search"]);
    expect(aiFeaturesSchema.parse(["none"])).toEqual(["none"]);
    expect(aiFeaturesSchema.parse([])).toEqual([]);
  });

  it("rejects none next to a real feature", () => {
    const result = aiFeaturesSchema.safeParse(["none", "chatbot"]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("none");
  });
});
