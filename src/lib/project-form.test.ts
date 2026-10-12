import { describe, expect, it } from "vitest";
import { projectInputSchema, type Project } from "@/schemas/project";
import { emptyFormValues, toFormErrors, toFormValues, toProjectInput } from "./project-form";

const SARA = "64b7f0c2a1b2c3d4e5f60718";

const filled = {
  ...emptyFormValues(),
  name: "  Calmly Care ",
  industry: "healthcare" as const,
  status: "delivered" as const,
  product_types: ["web_app" as const],
  lead_designer: SARA,
  summary: "A patient app.",
};

describe("toProjectInput", () => {
  it("produces valid input from the required fields alone", () => {
    const input = toProjectInput(filled, "calmly-care");
    expect(projectInputSchema.safeParse(input).success).toBe(true);
    expect(input).toMatchObject({ name: "Calmly Care", client_name: undefined, delivered_to: undefined });
  });

  it("turns empty strings into unset values and trims text", () => {
    const input = toProjectInput({ ...filled, client_name: "   ", country: " UK " }, "calmly-care");
    expect(input.client_name).toBeUndefined();
    expect(input.country).toBe("UK");
  });

  it("parses day strings as UTC midnight and numbers from text", () => {
    const input = toProjectInput({ ...filled, delivery_date: "2025-03-14", duration_weeks: "19" }, "calmly-care");
    expect(input.delivery_date?.toISOString()).toBe("2025-03-14T00:00:00.000Z");
    expect(input.duration_weeks).toBe(19);
  });

  it("lets bad dates and numbers through so validation flags the field", () => {
    const input = toProjectInput({ ...filled, start_date: "14/03/2025", duration_weeks: "lots" }, "calmly-care");
    const result = projectInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["start_date", "duration_weeks"]);
  });

  it("drops blank rows but keeps half-filled ones for validation", () => {
    const input = toProjectInput(
      {
        ...filled,
        figma_files: [
          { label: "", url: "" },
          { label: "Main", url: " https://example.com/f " },
          { label: "No url", url: "" },
        ],
        metrics: [{ label: " ", value: "" }],
      },
      "calmly-care",
    );
    expect(input.figma_files).toEqual([
      { label: "Main", url: "https://example.com/f" },
      { label: "No url", url: "" },
    ]);
    expect(input.metrics).toEqual([]);
  });

  it("only sets delivered_to when a name is given", () => {
    expect(toProjectInput({ ...filled, delivered_to_role: "CTO" }, "x").delivered_to).toBeUndefined();
    expect(toProjectInput({ ...filled, delivered_to_name: "Dana", delivered_to_role: "" }, "x").delivered_to).toEqual({
      name: "Dana",
      role: undefined,
    });
  });
});

describe("toFormValues", () => {
  it("round-trips a stored project", () => {
    const input = toProjectInput(
      {
        ...filled,
        client_name: "Calmly Health",
        delivery_date: "2025-03-14",
        delivered_to_name: "Dana",
        milestones: [{ name: "Sign-off", date: "2025-02-21" }],
        live_url: [{ label: "App", url: "https://example.com/app" }],
      },
      "calmly-care",
    );
    const project = {
      ...projectInputSchema.parse(input),
      id: "64b7f0c2a1b2c3d4e5f60720",
      review_status: "approved",
      updated_by: "system:seed",
      updated_at: new Date(),
    } satisfies Project;

    const values = toFormValues(project);
    expect(values).toMatchObject({
      name: "Calmly Care",
      client_name: "Calmly Health",
      delivery_date: "2025-03-14",
      start_date: "",
      delivered_to_name: "Dana",
      milestones: [{ name: "Sign-off", date: "2025-02-21" }],
    });
    expect(toProjectInput(values, "calmly-care")).toEqual(input);
  });
});

describe("toFormErrors", () => {
  it("maps nested paths to form fields and keeps the first message", () => {
    expect(
      toFormErrors([
        { path: "delivered_to.name", message: "required" },
        { path: "figma_files.0.url", message: "bad url" },
        { path: "figma_files.0.url", message: "second" },
        { path: "", message: "whole form" },
      ]),
    ).toEqual({ delivered_to_name: "required", "figma_files.0.url": "bad url", form: "whole form" });
  });
});
