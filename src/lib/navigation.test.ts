import { describe, expect, it } from "vitest";
import { libraryTabsFor, navItemsFor } from "./navigation";

const labels = (role: Parameters<typeof navItemsFor>[0]) => navItemsFor(role).map((item) => item.label);
const tabs = (role: Parameters<typeof libraryTabsFor>[0]) => libraryTabsFor(role).map((item) => item.label);

describe("navItemsFor", () => {
  it("shows each role its screens and nothing more", () => {
    expect(labels(undefined)).toEqual([]);
    expect(labels("pending")).toEqual([]);
    expect(labels("viewer")).toEqual(["home", "projects"]);
    expect(labels("editor")).toEqual(["home", "projects"]);
    expect(labels("admin")).toEqual(["home", "projects", "users", "settings"]);
  });
});

describe("libraryTabsFor", () => {
  it("adds drafts for editors and review for admins", () => {
    expect(tabs("pending")).toEqual([]);
    expect(tabs("viewer")).toEqual(["All projects", "Visuals"]);
    expect(tabs("editor")).toEqual(["All projects", "Visuals", "Drafts"]);
    expect(tabs("admin")).toEqual(["All projects", "Visuals", "Drafts", "Review"]);
  });
});
