import { describe, expect, it } from "vitest";
import { hasRole } from "./auth-rules";

describe("hasRole", () => {
  it("grants a role and everything below it", () => {
    expect(hasRole("admin", "viewer")).toBe(true);
    expect(hasRole("admin", "editor")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("viewer", "viewer")).toBe(true);
  });

  it("refuses roles above the user's", () => {
    expect(hasRole("viewer", "editor")).toBe(false);
    expect(hasRole("editor", "admin")).toBe(false);
  });
});
