import { describe, expect, it } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(toSlug("Elia Wellness Platform")).toBe("elia-wellness-platform");
  });

  it("strips accents so imported names match", () => {
    expect(toSlug("Café Réservé")).toBe("cafe-reserve");
  });

  it("spells out ampersands and drops other punctuation", () => {
    expect(toSlug("  HR & Payroll (v2)! ")).toBe("hr-and-payroll-v2");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(toSlug("!!!")).toBe("");
  });

  it("is stable when applied twice", () => {
    expect(toSlug(toSlug("Vocable — Mobile App"))).toBe("vocable-mobile-app");
  });
});
