import { describe, expect, it } from "vitest";
import { paginationSchema, projectFiltersSchema } from "./project-filters";

describe("projectFiltersSchema", () => {
  it("accepts URL-style strings and coerces the year", () => {
    expect(projectFiltersSchema.parse({ q: " elia ", industry: "healthcare", year: "2025" })).toEqual({
      q: "elia",
      industry: "healthcare",
      year: 2025,
    });
  });

  it("rejects unknown tags, bad ids and out-of-range years", () => {
    expect(projectFiltersSchema.safeParse({ industry: "crypto" }).success).toBe(false);
    expect(projectFiltersSchema.safeParse({ designer: "sara" }).success).toBe(false);
    expect(projectFiltersSchema.safeParse({ year: "1999" }).success).toBe(false);
    expect(projectFiltersSchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("defaults to the first page of 24", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, page_size: 24 });
  });

  it("caps page size", () => {
    expect(paginationSchema.safeParse({ page_size: "500" }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
