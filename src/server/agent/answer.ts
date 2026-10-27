import "server-only";
import { z } from "zod";
import { ANSWER_VERDICT } from "@/lib/constants";
import { escapeRegExp } from "@/lib/regex";
import type { AnswerProject, AnswerRecord } from "@/schemas/answer";
import { slugSchema } from "@/schemas/common";
import { AI_CONFIG } from "@/server/ai/config";
import { findVisibleProjectsBySlugs } from "@/server/repositories/projects";
import { getCoverUrls } from "@/server/services/visuals";

/** The final answer the agent hands over through the submit_answer tool. */
export const submittedAnswerSchema = z.object({
  verdict: z.enum(ANSWER_VERDICT.keys).nullable().describe('"yes", "partly" or "no" for "have we done X?" questions; null otherwise.'),
  projects: z
    .array(
      z.object({
        slug: slugSchema.describe("Exactly as a tool returned it."),
        why: z.string().trim().min(3).max(200).describe("One line: why this project fits, or for a closest match, how it differs."),
      }),
    )
    .max(AI_CONFIG.search.topK)
    .describe("The projects the answer relies on, best first."),
  answer: z.string().trim().min(1).max(4000).describe("The reply the person reads: plain text, short direct sentences."),
});

export type SubmittedAnswer = z.infer<typeof submittedAnswerSchema>;

export const SUBMIT_ANSWER_TOOL = {
  name: "submit_answer",
  description:
    "Finish the turn with your answer. Call it exactly once, after you have the facts you need. Only cite projects that a tool returned in this conversation.",
  input: submittedAnswerSchema,
} as const;

export type GuardResult = { ok: true } | { ok: false; problems: string[] };

/**
 * The fact guard (SPEC answer rule 2): every cited project must have come
 * from a tool, and the text mustn't name a project no tool returned. Known
 * names come from the library, so a made-up project can't slip through as
 * one we haven't heard of either: it simply has no card.
 */
export function checkAnswer(
  answer: SubmittedAnswer,
  revealed: ReadonlySet<string>,
  library: readonly { slug: string; name: string }[],
): GuardResult {
  const problems: string[] = [];
  const cited = answer.projects.map((project) => project.slug);

  const unknown = cited.filter((slug) => !revealed.has(slug));
  if (unknown.length > 0) problems.push(`These projects weren't returned by any tool: ${unknown.join(", ")}. Look them up first or leave them out.`);
  if (new Set(cited).size !== cited.length) problems.push("A project is cited twice.");

  const named = library.filter(({ slug, name }) => !revealed.has(slug) && nameMentioned(name, answer.answer));
  if (named.length > 0) problems.push(`The answer names ${named.map(({ name }) => name).join(", ")}, which no tool returned. Look them up first or leave them out.`);

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

const CARD_LINKS = 3;

/** Answer cards built from the database, never from the model's text, so names, tags and links are real. */
export async function buildAnswerCards(answer: SubmittedAnswer): Promise<{ projects: AnswerProject[]; records: AnswerRecord[] }> {
  const slugs = answer.projects.map((project) => project.slug);
  const [projects, covers] = await Promise.all([findVisibleProjectsBySlugs(slugs), getCoverUrls(slugs)]);
  const bySlug = new Map(projects.map((project) => [project.slug, project]));

  const cards = answer.projects.flatMap(({ slug, why }): AnswerProject[] => {
    const project = bySlug.get(slug);
    if (!project) return [];
    const cover = covers.get(slug);
    return [
      {
        slug,
        name: project.name,
        industry: project.industry,
        product_types: project.product_types,
        why,
        links: [...project.figma_files, ...project.prototype_url, ...project.live_url].slice(0, CARD_LINKS),
        ...(cover && { cover_url: cover }),
      },
    ];
  });
  return { projects: cards, records: cards.map(({ slug, name }) => ({ slug, name })) };
}

/** Project names the guard watches for in the answer text. */
export function nameMentioned(name: string, text: string): boolean {
  return new RegExp(`(^|\\W)${escapeRegExp(name)}(\\W|$)`, "i").test(text);
}
