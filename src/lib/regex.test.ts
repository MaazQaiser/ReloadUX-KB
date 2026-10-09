import { describe, expect, it } from "vitest";
import { escapeRegExp } from "./regex";

describe("escapeRegExp", () => {
  it("makes special characters literal", () => {
    const text = "HR (v2) + Payroll? [beta] $5.00 a|b ^x \\ {1}";
    expect(new RegExp(escapeRegExp(text)).test(text)).toBe(true);
    expect(new RegExp(`^${escapeRegExp("a.c")}$`).test("abc")).toBe(false);
  });

  it("leaves plain text alone", () => {
    expect(escapeRegExp("vocable")).toBe("vocable");
  });
});
