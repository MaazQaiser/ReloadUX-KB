import "server-only";
import { z } from "zod";
import { getAiConfig } from "@/env";
import { cosineSimilarity, wordOverlap } from "@/lib/vector";
import { AI_CONFIG } from "@/server/ai/config";
import { embed } from "@/server/ai/voyage";
import { listVerifiedAnswers } from "@/server/repositories/verified-answers";
import { defineTool } from "./types";

export const getVerifiedAnswerTool = defineTool({
  name: "get_verified_answer",
  description: [
    "Check whether the team has already approved an answer to a question very like this one. Call it once, early, for questions",
    "people tend to repeat. It returns the closest approved answer and its projects only when the questions are near-identical in",
    "meaning; otherwise match is null. An approved answer can be out of date: confirm its projects with get_project before relying on it.",
  ].join(" "),
  input: z.object({ question: z.string().trim().min(3).max(1000) }),
  async run({ question }) {
    const answers = await listVerifiedAnswers();
    if (answers.length === 0) return { content: { match: null }, projectSlugs: [] };

    let scored: { index: number; similarity: number }[];
    let threshold: number;
    if (getAiConfig().voyageApiKey) {
      const [asked, ...known] = await embed([question, ...answers.map((answer) => answer.question)], "query");
      scored = known.map((vector, index) => ({ index, similarity: asked ? cosineSimilarity(asked, vector) : 0 }));
      threshold = AI_CONFIG.search.verifiedAnswerSimilarity;
    } else {
      scored = answers.map((answer, index) => ({ index, similarity: wordOverlap(question, answer.question) }));
      threshold = AI_CONFIG.search.verifiedAnswerOverlap;
    }
    const best = scored.sort((a, b) => b.similarity - a.similarity)[0];
    const answer = best && best.similarity >= threshold ? answers[best.index] : undefined;
    if (!answer || !best) return { content: { match: null }, projectSlugs: [] };
    return {
      content: {
        match: { question: answer.question, answer: answer.answer, project_slugs: answer.project_slugs, similarity: Number(best.similarity.toFixed(3)) },
      },
      projectSlugs: answer.project_slugs,
    };
  },
});
