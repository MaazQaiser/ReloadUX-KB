import { describe, expect, it } from "vitest";
import { paginationSchema, parseProjectSearch, projectFiltersSchema, projectSearchHref } from "./project-filters";

describe("projectFiltersSchema", () => {
  it("accepts URL-style strings and coerces the year", () => {
    expect(projectFiltersSchema.parse({ q: " elia ", industry: "healthcare", year: "2025" })).toEqual({
      q: "elia",
      industry: "healthcare",
      year: 2025,
    });
  });

  it("rejects unknown tags, bad ids and out-of-range years", () => {
    expect(projectFiltersSchema.safeParse({ industry: "Crypto!" }).success).toBe(false);
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

describe("parseProjectSearch", () => {
  it("reads valid params and defaults pagination", () => {
    expect(parseProjectSearch({ industry: "fintech", year: "2025", q: "ledger" })).toEqual({
      filters: { industry: "fintech", year: 2025, q: "ledger" },
      pagination: { page: 1, page_size: 24 },
      ignored: [],
    });
  });

  it("drops invalid params one by one and reports them", () => {
    expect(parseProjectSearch({ industry: "Crypto!", flow: "onboarding", page: "-3" })).toEqual({
      filters: { flow: "onboarding" },
      pagination: { page: 1, page_size: 24 },
      ignored: ["industry", "page"],
    });
  });

  it("treats empty strings as unset and takes the first of repeated params", () => {
    expect(parseProjectSearch({ q: "", industry: ["hr", "legal"], page: "2" })).toMatchObject({
      filters: { industry: "hr" },
      pagination: { page: 2 },
      ignored: [],
    });
  });

  it("does not let the URL set the page size", () => {
    expect(parseProjectSearch({ page_size: "100" }).pagination.page_size).toBe(24);
  });
});

describe("projectSearchHref", () => {
  it("builds a URL from set filters and the page", () => {
    expect(projectSearchHref({ industry: "hr", year: 2024, q: "a b" }, 2)).toBe(
      "/projects?industry=hr&year=2024&q=a+b&page=2",
    );
  });

  it("returns the bare path with no filters on page 1", () => {
    expect(projectSearchHref({})).toBe("/projects");
  });

  it("round-trips through parseProjectSearch", () => {
    const filters = { flow: "checkout" as const, designer: "64b7f0c2a1b2c3d4e5f60718" };
    const query = Object.fromEntries(new URL(projectSearchHref(filters, 3), "http://x").searchParams);
    expect(parseProjectSearch(query)).toMatchObject({ filters, pagination: { page: 3 } });
  });
});
