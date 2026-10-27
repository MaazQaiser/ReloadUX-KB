import { describe, expect, it } from "vitest";
import { MAX_HISTORY_ANSWER_LENGTH, MAX_HISTORY_TURNS } from "@/lib/constants";
import { historyFrom, type Turn } from "./use-ask";

const turn = (index: number, overrides: Partial<Turn> = {}): Turn => ({
  key: String(index),
  question: `Question ${index}`,
  state: "done",
  verdict: null,
  projects: [],
  records: [],
  text: `Answer ${index}`,
  ...overrides,
});

describe("historyFrom", () => {
  it("keeps the newest finished turns that have an answer", () => {
    const turns = [
      ...Array.from({ length: MAX_HISTORY_TURNS + 2 }, (_, index) => turn(index)),
      turn(98, { state: "error", text: "" }),
      turn(99, { state: "streaming" }),
    ];
    const history = historyFrom(turns);
    expect(history).toHaveLength(MAX_HISTORY_TURNS);
    expect(history.at(-1)).toEqual({ question: `Question ${MAX_HISTORY_TURNS + 1}`, answer: `Answer ${MAX_HISTORY_TURNS + 1}` });
  });

  it("trims long answers to the size the server accepts", () => {
    const [entry] = historyFrom([turn(1, { text: "x".repeat(MAX_HISTORY_ANSWER_LENGTH + 50) })]);
    expect(entry?.answer).toHaveLength(MAX_HISTORY_ANSWER_LENGTH);
  });
});
