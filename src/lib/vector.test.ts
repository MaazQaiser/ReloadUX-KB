import { describe, expect, it } from "vitest";
import { cosineSimilarity, wordOverlap } from "./vector";

describe("cosineSimilarity", () => {
  it("is 1 for the same direction, 0 for unrelated and for zero vectors", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("wordOverlap", () => {
  it("compares distinct words, ignoring case and punctuation", () => {
    expect(wordOverlap("Have we done a healthcare chatbot?", "have we done a HEALTHCARE chatbot")).toBe(1);
    expect(wordOverlap("healthcare chatbot", "fintech app")).toBe(0);
    expect(wordOverlap("", "anything")).toBe(0);
  });
});
