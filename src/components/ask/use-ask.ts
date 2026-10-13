"use client";

import { useCallback, useRef, useState } from "react";
import { readNdjson } from "@/lib/ndjson";
import { askEventSchema, type AnswerProject, type AnswerRecord, type AnswerVerdict } from "@/schemas/answer";

export type TurnState = "streaming" | "done" | "stopped" | "error";

export interface Turn {
  key: string;
  question: string;
  state: TurnState;
  status?: string;
  verdict: AnswerVerdict | null;
  projects: AnswerProject[];
  records: AnswerRecord[];
  text: string;
  /** Set when the answer finishes; feedback is tied to it. */
  turnId?: string;
  error?: string;
}

const HTTP_ERRORS: Record<number, string> = {
  401: "Your session has expired. Reload the page to sign in again.",
  403: "Your account can't ask questions. Ask an admin for access.",
  400: "That question couldn't be sent. Shorten it and try again.",
};
const GENERIC_ERROR = "Something went wrong while answering. Try again in a moment.";

/** Sends questions to /api/ask and folds the streamed events into a list of turns. */
export function useAsk() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const controllerRef = useRef<AbortController | null>(null);

  const update = useCallback((key: string, change: (turn: Turn) => Partial<Turn>) => {
    setTurns((all) => all.map((turn) => (turn.key === key ? { ...turn, ...change(turn) } : turn)));
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const key = crypto.randomUUID();
      const controller = new AbortController();
      controllerRef.current = controller;
      setTurns((all) => [
        ...all,
        { key, question, state: "streaming", verdict: null, projects: [], records: [], text: "" },
      ]);

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          update(key, () => ({ state: "error", error: HTTP_ERRORS[response.status] ?? GENERIC_ERROR }));
          return;
        }
        for await (const raw of readNdjson(response.body)) {
          const event = askEventSchema.safeParse(raw);
          if (!event.success) throw new Error("unexpected event from /api/ask");
          const data = event.data;
          switch (data.type) {
            case "status":
              update(key, () => ({ status: data.label }));
              break;
            case "answer":
              update(key, () => ({ verdict: data.verdict, projects: data.projects, records: data.records, status: undefined }));
              break;
            case "text":
              update(key, (turn) => ({ text: turn.text + data.delta }));
              break;
            case "done":
              update(key, () => ({ state: "done", turnId: data.turn_id }));
              break;
            case "error":
              update(key, () => ({ state: "error", error: data.message }));
              break;
          }
        }
      } catch {
        if (controller.signal.aborted) update(key, () => ({ state: "stopped", status: undefined }));
        else update(key, () => ({ state: "error", error: GENERIC_ERROR, status: undefined }));
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [update],
  );

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  const busy = turns.at(-1)?.state === "streaming";
  return { turns, ask, stop, busy };
}
