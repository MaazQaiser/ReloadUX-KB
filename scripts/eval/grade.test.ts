import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evalSetSchema, grade, type CaseOutput, type EvalCase } from "./grade";

const set = evalSetSchema.parse(JSON.parse(readFileSync("evals/evals.json", "utf8")));

/** What a correct answer looks like according to the case itself: it must pass. */
function oracle(testCase: EvalCase): CaseOutput {
  const { verdict, top3, must_mention } = testCase.expect;
  return {
    answered: true,
    verdict: verdict === "any" ? null : (verdict[0] ?? null),
    cited: testCase.expect.cite_none ? [] : (top3?.slice(0, 1) ?? []),
    text: must_mention.map((entry) => (Array.isArray(entry) ? entry[0] : entry)).join(". "),
  };
}

describe("the eval set", () => {
  it("is valid and big enough to mean something", () => {
    expect(set.cases.length).toBeGreaterThanOrEqual(50);
  });

  it("covers yes, partly, no, details, lists, follow-ups and safety", () => {
    const tags = new Set(set.cases.flatMap((c) => c.tags));
    for (const tag of ["match", "partly", "no", "detail", "list", "followup", "safety", "not-recorded", "nda"]) expect(tags).toContain(tag);
  });

  it("checks something on every case", () => {
    for (const c of set.cases) {
      const e = c.expect;
      expect(e.verdict !== "any" || e.top3 || e.must_mention.length > 0 || e.must_not_mention.length > 0 || e.cite_none, c.id).toBeTruthy();
    }
  });
});

describe("grade", () => {
  it("passes the oracle answer for every case (the case and grader agree)", () => {
    for (const c of set.cases) expect(grade(c, oracle(c)).pass, c.id).toBe(true);
  });

  it("fails every case when there is no answer (no answer is never a pass)", () => {
    for (const c of set.cases) expect(grade(c, { answered: false, verdict: null, cited: [], text: "" }).pass, c.id).toBe(false);
  });

  it("fails a confident wrong answer", () => {
    const c = set.cases.find((item) => item.id === "detail-lead-calmly")!;
    expect(grade(c, { answered: true, verdict: null, cited: ["calmly-care"], text: "Hamza Tariq led Calmly Care." })).toMatchObject({ pass: false, missing: ["Sara Malik"] });
  });

  it("flags invented facts and forbidden citations", () => {
    const learnloop = set.cases.find((item) => item.id === "detail-not-delivered-learnloop")!;
    expect(grade(learnloop, { answered: true, verdict: null, cited: ["learnloop"], text: "Learnloop was delivered in May, not yet live." })).toMatchObject({
      pass: false,
      checks: { no_forbidden: false },
    });
    const b2c = set.cases.find((item) => item.id === "list-b2c")!;
    const text = "Calmly Care, Ledgerly, Cartwheel and Questline. Peoplepath is B2B, so it's not on the list.";
    expect(grade(b2c, { answered: true, verdict: null, cited: ["calmly-care", "ledgerly", "cartwheel", "questline"], text }).pass).toBe(true);
    expect(grade(b2c, { answered: true, verdict: null, cited: ["calmly-care", "peoplepath-hrms"], text }).forbidden).toEqual(["cited peoplepath-hrms"]);
  });

  it("ignores case when matching text", () => {
    const c = set.cases.find((item) => item.id === "detail-nda-calmly")!;
    expect(grade(c, { answered: true, verdict: null, cited: ["calmly-care"], text: "Yes, it's under nda." }).pass).toBe(true);
  });
});
