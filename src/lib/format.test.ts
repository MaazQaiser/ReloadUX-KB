import { describe, expect, it } from "vitest";
import { formatDate, formatWeeks, formatYear } from "./format";

describe("format", () => {
  it("formats dates in UTC so they don't shift by timezone", () => {
    expect(formatDate(new Date("2025-03-14"))).toBe("14 Mar 2025");
    expect(formatYear(new Date("2025-01-01T00:00:00Z"))).toBe(2025);
  });

  it("pluralises weeks", () => {
    expect(formatWeeks(1)).toBe("1 week");
    expect(formatWeeks(19)).toBe("19 weeks");
  });
});
