import { describe, expect, it } from "vitest";
import { builtInCatalog, keyFromLabel, mergeCatalog, tagLabel, tagOptions } from "./tag-catalog";

describe("tag catalog", () => {
  it("adds admin values after the built-in ones and ignores clashes with built-ins", () => {
    const catalog = mergeCatalog([
      { list: "industry", key: "real_estate", label: "Real estate" },
      { list: "industry", key: "fintech", label: "Money" },
      { list: "flows", key: "kyc", label: "KYC" },
    ]);
    expect(catalog.industry.keys.slice(-2)).toEqual(["other", "real_estate"]);
    expect(catalog.industry.added).toEqual(["real_estate"]);
    expect(tagLabel(catalog.industry, "fintech")).toBe("fintech");
    expect(tagLabel(catalog.flows, "kyc")).toBe("KYC");
    expect(tagOptions(catalog.flows).at(-1)).toEqual({ value: "kyc", label: "KYC" });
  });

  it("falls back to a readable key when a value isn't in this catalog", () => {
    expect(tagLabel(builtInCatalog().industry, "real_estate")).toBe("real estate");
  });

  it("derives stable keys from labels", () => {
    expect(keyFromLabel("Real estate / PropTech")).toBe("real_estate_proptech");
    expect(keyFromLabel("  AR & VR ")).toBe("ar_and_vr");
    expect(keyFromLabel("Café")).toBe("cafe");
    expect(keyFromLabel("!!!")).toBe("");
  });
});
