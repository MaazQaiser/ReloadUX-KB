import { describe, expect, it } from "vitest";
import { isSameOrigin, safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/projects/calmly-care?x=1")).toBe("/projects/calmly-care?x=1");
    expect(safeNextPath(["/projects", "/other"])).toBe("/projects");
  });

  it.each([undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "projects"])(
    "falls back for %j",
    (next) => {
      expect(safeNextPath(next)).toBe("/projects");
    },
  );
});

describe("isSameOrigin", () => {
  it("matches origin host to request host", () => {
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isSameOrigin("https://kb.reloadux.com", "kb.reloadux.com")).toBe(true);
  });

  it("refuses missing, foreign or malformed origins", () => {
    expect(isSameOrigin(null, "localhost:3000")).toBe(false);
    expect(isSameOrigin("https://evil.example", "kb.reloadux.com")).toBe(false);
    expect(isSameOrigin("not a url", "kb.reloadux.com")).toBe(false);
  });
});
