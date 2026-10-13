import { describe, expect, it } from "vitest";
import { navItemsFor } from "./navigation";

const labels = (role: Parameters<typeof navItemsFor>[0]) => navItemsFor(role).map((item) => item.label);

describe("navItemsFor", () => {
  it("shows each role its screens and nothing more", () => {
    expect(labels(undefined)).toEqual([]);
    expect(labels("pending")).toEqual([]);
    expect(labels("viewer")).toEqual(["ask", "projects", "visuals"]);
    expect(labels("editor")).toEqual(["ask", "projects", "visuals", "admin chat"]);
    expect(labels("admin")).toEqual(["ask", "projects", "visuals", "admin chat", "review", "settings"]);
  });
});
