import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toSlug } from "@/lib/slug";
import { actorSchema, idSchema, linkSchema, metricSchema, milestoneSchema, slugSchema, uniqueList } from "./common";

describe("slugSchema", () => {
  it.each(["Elia Wellness", "HR & Payroll (v2)", "Vocable — Mobile App"])("accepts toSlug(%j)", (name) => {
    expect(slugSchema.safeParse(toSlug(name)).success).toBe(true);
  });

  it.each(["", "Vocable", "vocable_app", "-vocable", "vocable--app", "vocable app"])("rejects %j", (value) => {
    expect(slugSchema.safeParse(value).success).toBe(false);
  });
});

describe("idSchema and actorSchema", () => {
  const id = "64b7f0c2a1b2c3d4e5f60718";

  it("accepts a 24-character hex id", () => {
    expect(idSchema.parse(id)).toBe(id);
    expect(idSchema.safeParse("not-an-id").success).toBe(false);
  });

  it("accepts a user id or a system actor", () => {
    expect(actorSchema.safeParse(id).success).toBe(true);
    expect(actorSchema.safeParse("system:seed").success).toBe(true);
    expect(actorSchema.safeParse("sara").success).toBe(false);
    expect(actorSchema.safeParse("system:").success).toBe(false);
  });
});

describe("linkSchema", () => {
  it("accepts http and https links and trims the label", () => {
    expect(linkSchema.parse({ label: "  Main file ", url: "https://www.figma.com/design/abc/Vocable" })).toEqual({
      label: "Main file",
      url: "https://www.figma.com/design/abc/Vocable",
    });
    expect(linkSchema.safeParse({ label: "Staging", url: "http://staging.example.com" }).success).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://files.example.com",
    "figma.com/design/abc",
    "https://localhost",
  ])("rejects %j", (url) => {
    expect(linkSchema.safeParse({ label: "x", url }).success).toBe(false);
  });

  it("requires a label", () => {
    expect(linkSchema.safeParse({ label: "   ", url: "https://example.com" }).success).toBe(false);
  });
});

describe("milestoneSchema and metricSchema", () => {
  it("parses a milestone with a real date", () => {
    const date = new Date("2026-03-12");
    expect(milestoneSchema.parse({ name: "Handoff", date })).toEqual({ name: "Handoff", date });
    expect(milestoneSchema.safeParse({ name: "Handoff", date: "2026-03-12" }).success).toBe(false);
  });

  it("keeps metric values as text", () => {
    expect(metricSchema.parse({ label: "Activation", value: "+40%" })).toEqual({ label: "Activation", value: "+40%" });
  });
});

describe("uniqueList", () => {
  const list = uniqueList(z.enum(["a", "b"]));

  it("accepts distinct values, including none", () => {
    expect(list.parse(["a", "b"])).toEqual(["a", "b"]);
    expect(list.parse([])).toEqual([]);
  });

  it("rejects repeated values", () => {
    expect(list.safeParse(["a", "a"]).success).toBe(false);
  });
});
