import { describe, expect, it } from "vitest";
import { initials } from "./user-avatar";

describe("initials", () => {
  it("uses first and last name, or the start of an email", () => {
    expect(initials("Maaz Qaiser")).toBe("MQ");
    expect(initials("Sara Ali Malik")).toBe("SM");
    expect(initials("cher")).toBe("C");
    expect(initials("maaz.qaiser@reloadux.com")).toBe("MQ");
    expect(initials("")).toBe("?");
  });
});
