import { z } from "zod";

const verdictSchema = z.enum(["yes", "partly", "no"]).nullable();
/** A string must appear; a list passes if any one of its alternatives appears. */
const mentionSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

export const evalCaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  tags: z.array(z.string()).min(1),
  question: z.string().min(3),
  history: z.array(z.object({ question: z.string(), answer: z.string() })).max(4).default([]),
  expect: z.object({
    verdict: z.union([z.literal("any"), z.array(verdictSchema).min(1)]),
    top3: z.array(z.string()).min(1).optional(),
    must_mention: z.array(mentionSchema).default([]),
    must_not_mention: z.array(z.string().min(1)).default([]),
    cite_none: z.boolean().default(false),
    cite_exclude: z.array(z.string()).default([]),
  }),
});

export const evalSetSchema = z.object({
  version: z.number().int(),
  source: z.string(),
  notes: z.string(),
  cases: z.array(evalCaseSchema).min(1).refine((cases) => new Set(cases.map((c) => c.id)).size === cases.length, "case ids must be unique"),
});

export type EvalCase = z.infer<typeof evalCaseSchema>;

/** What the app produced for a case. `answered` is false when the turn ended without an answer. */
export interface CaseOutput {
  answered: boolean;
  verdict: "yes" | "partly" | "no" | null;
  cited: string[];
  text: string;
}

/** Each check is true (passed), false (failed) or null (doesn't apply to this case). */
export interface Grade {
  pass: boolean;
  checks: {
    answered: boolean;
    verdict: boolean | null;
    top3: boolean | null;
    mentions: boolean | null;
    /** The "zero invented facts" signal: nothing the case forbids was stated or cited. */
    no_forbidden: boolean | null;
  };
  missing: string[];
  forbidden: string[];
}

const contains = (text: string, needle: string) => text.toLowerCase().includes(needle.toLowerCase());

export function grade(testCase: EvalCase, output: CaseOutput): Grade {
  const { expect: want } = testCase;
  if (!output.answered) {
    return { pass: false, checks: { answered: false, verdict: null, top3: null, mentions: null, no_forbidden: null }, missing: [], forbidden: [] };
  }

  const verdict = want.verdict === "any" ? null : want.verdict.includes(output.verdict);
  const top3 = want.top3 ? output.cited.slice(0, 3).some((slug) => want.top3?.includes(slug)) : null;
  const missing = want.must_mention
    .filter((entry) => !(Array.isArray(entry) ? entry.some((alt) => contains(output.text, alt)) : contains(output.text, entry)))
    .map((entry) => (Array.isArray(entry) ? entry.join(" | ") : entry));
  const forbidden = [
    ...want.must_not_mention.filter((needle) => contains(output.text, needle)),
    ...output.cited.filter((slug) => want.cite_exclude.includes(slug)).map((slug) => `cited ${slug}`),
    ...(want.cite_none && output.cited.length > 0 ? [`cited ${output.cited.join(", ")}`] : []),
  ];
  const mentions = want.must_mention.length > 0 ? missing.length === 0 : null;
  const checksForbidden = want.must_not_mention.length > 0 || want.cite_exclude.length > 0 || want.cite_none;
  const no_forbidden = checksForbidden ? forbidden.length === 0 : null;

  const checks = { answered: true, verdict, top3, mentions, no_forbidden };
  return { pass: [verdict, top3, mentions, no_forbidden].every((check) => check !== false), checks, missing, forbidden };
}
