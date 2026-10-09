import { describe, expect, it } from "vitest";
import { hasRole, isAllowedEmail } from "./auth-rules";

describe("isAllowedEmail", () => {
  it.each(["sara@reloadux.com", "Sara.Malik@ReloadUX.com"])("allows %s", (email) => {
    expect(isAllowedEmail(email)).toBe(true);
  });

  it.each([
    "sara@gmail.com",
    "sara@sub.reloadux.com",
    "sara@reloadux.com.evil.io",
    "sara@notreloadux.com",
    "reloadux.com",
    "@reloadux.com",
    "a@b@reloadux.com",
    "",
  ])("refuses %j", (email) => {
    expect(isAllowedEmail(email)).toBe(false);
  });
});

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
