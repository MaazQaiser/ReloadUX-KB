import { describe, expect, it } from "vitest";
import { checkAnswer, nameMentioned, type SubmittedAnswer } from "./answer";

const library = [
  { slug: "calmly-care", name: "Calmly Care" },
  { slug: "ledgerly", name: "Ledgerly" },
];
const answer = (overrides: Partial<SubmittedAnswer> = {}): SubmittedAnswer => ({
  verdict: "yes",
  projects: [{ slug: "calmly-care", why: "Healthcare chatbot" }],
  answer: "Yes: Calmly Care.",
  ...overrides,
});

describe("checkAnswer", () => {
  it("accepts an answer that only cites and names projects tools returned", () => {
    expect(checkAnswer(answer(), new Set(["calmly-care"]), library)).toEqual({ ok: true });
  });

  it("rejects a cited project no tool returned", () => {
    expect(checkAnswer(answer(), new Set(), library)).toMatchObject({ ok: false, problems: expect.arrayContaining([expect.stringContaining("calmly-care")]) });
  });

  it("rejects the same project cited twice", () => {
    const twice = answer({ projects: [{ slug: "calmly-care", why: "first" }, { slug: "calmly-care", why: "again" }] });
    expect(checkAnswer(twice, new Set(["calmly-care"]), library)).toMatchObject({ ok: false });
  });

  it("rejects text that names a library project no tool returned", () => {
    const result = checkAnswer(answer({ answer: "Calmly Care, and Ledgerly too." }), new Set(["calmly-care"]), library);
    expect(result).toMatchObject({ ok: false, problems: [expect.stringContaining("Ledgerly")] });
  });
});

describe("nameMentioned", () => {
  it("matches whole names only, ignoring case", () => {
    expect(nameMentioned("Ledgerly", "We built LEDGERLY.")).toBe(true);
    expect(nameMentioned("Ledgerly", "Ledgerlyish things")).toBe(false);
  });
});
