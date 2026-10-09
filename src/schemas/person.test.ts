import { describe, expect, it } from "vitest";
import { personInputSchema, personSchema } from "./person";

const input = { name: "  Sara Khan ", slug: "sara-khan", roles: ["designer"] };

describe("personInputSchema", () => {
  it("trims the name and defaults active to true", () => {
    expect(personInputSchema.parse(input)).toEqual({
      name: "Sara Khan",
      slug: "sara-khan",
      roles: ["designer"],
      active: true,
    });
  });

  it("lowercases the email and allows it to be left out", () => {
    expect(personInputSchema.parse({ ...input, email: "Sara@ReloadUX.com" }).email).toBe("sara@reloadux.com");
  });

  it("rejects an invalid email", () => {
    expect(personInputSchema.safeParse({ ...input, email: "sara" }).success).toBe(false);
  });

  it("needs at least one known role, without repeats", () => {
    expect(personInputSchema.safeParse({ ...input, roles: [] }).success).toBe(false);
    expect(personInputSchema.safeParse({ ...input, roles: ["intern"] }).success).toBe(false);
    expect(personInputSchema.safeParse({ ...input, roles: ["designer", "designer"] }).success).toBe(false);
    expect(personInputSchema.parse({ ...input, roles: ["designer", "account_manager"] }).roles).toHaveLength(2);
  });

  it("rejects a slug that is not lowercase-hyphenated", () => {
    expect(personInputSchema.safeParse({ ...input, slug: "Sara Khan" }).success).toBe(false);
  });

  it("drops fields that are not in the spec", () => {
    expect(personInputSchema.parse({ ...input, salary: 100 })).not.toHaveProperty("salary");
  });
});

describe("personSchema", () => {
  it("adds id and audit fields", () => {
    const stored = {
      ...input,
      id: "64b7f0c2a1b2c3d4e5f60718",
      active: true,
      updated_by: "system:seed",
      updated_at: new Date("2026-10-09T12:00:00Z"),
    };
    expect(personSchema.parse(stored)).toMatchObject({ id: stored.id, updated_by: "system:seed" });
    expect(personSchema.safeParse({ ...stored, updated_by: "" }).success).toBe(false);
  });
});
