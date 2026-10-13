"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";
import { AnswerTurn } from "./answer-turn";
import { useAsk } from "./use-ask";

export function AskChat({ starters }: { starters: readonly string[] }) {
  const { turns, ask, stop, busy } = useAsk();
  const [question, setQuestion] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastState = turns.at(-1)?.state;

  // Follow the newest turn as it grows, and hand focus back to the box when it ends.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns]);
  useEffect(() => {
    if (lastState && lastState !== "streaming") inputRef.current?.focus();
  }, [lastState]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setQuestion("");
    void ask(trimmed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(question);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line; IME composition must not send half a word.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(question);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-10">
      {turns.length === 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Try asking</h2>
          <ul className="grid border-t border-l sm:grid-cols-2">
            {starters.map((starter) => (
              <li key={starter} className="border-r border-b">
                <button
                  type="button"
                  onClick={() => send(starter)}
                  className="h-full w-full p-6 text-left text-lg transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline-none"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="flex flex-col gap-10" aria-label="Conversation">
          {turns.map((turn) => (
            <AnswerTurn key={turn.key} turn={turn} />
          ))}
        </ol>
      )}

      <p role="status" className="sr-only">
        {lastState === "done" ? "Answer ready." : ""}
      </p>
      <div ref={endRef} />

      <form onSubmit={onSubmit} className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t bg-background pt-4 pb-6">
        <Label htmlFor="ask-question" className="sr-only">
          Ask about past projects
        </Label>
        <div className="flex items-end gap-3">
          <Textarea
            ref={inputRef}
            id="ask-question"
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Have we done a healthcare chatbot?"
            className="max-h-48 min-h-12 text-base"
            autoFocus
          />
          {busy ? (
            <Button type="button" variant="outline" size="lg" onClick={stop}>
              <Square aria-hidden />
              Stop
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={!question.trim()}>
              <ArrowUp aria-hidden />
              Ask
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Enter to send, Shift+Enter for a new line.</p>
      </form>
    </div>
  );
}
