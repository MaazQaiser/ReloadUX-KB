import { describe, expect, it } from "vitest";
import { z } from "zod";
import { err, ok, toValidationIssues } from "./result";

describe("result helpers", () => {
  it("wraps values and errors", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("nope")).toEqual({ ok: false, error: "nope" });
  });

  it("flattens zod issues into dotted paths", () => {
    const schema = z.object({ links: z.array(z.object({ url: z.url() })) });
    const result = schema.safeParse({ links: [{ url: "bad" }] });
    if (result.success) throw new Error("expected failure");

    expect(toValidationIssues(result.error)).toEqual([{ path: "links.0.url", message: expect.any(String) }]);
  });
});
