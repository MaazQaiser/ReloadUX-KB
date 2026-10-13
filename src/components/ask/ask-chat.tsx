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
    // Bottom padding keeps the last answer clear of the floating ask bar.
    <div className="flex flex-1 flex-col gap-10 pb-36">
      {turns.length === 0 ? (
        <section aria-labelledby="try-asking" className="rx-glow-band -mx-4 flex flex-col items-center gap-8 px-4 py-16 text-center sm:-mx-8 sm:py-24">
          <h2 id="try-asking" className="max-w-2xl text-2xl sm:text-3xl">
            Try asking
          </h2>
          <ul className="flex max-w-3xl flex-wrap justify-center gap-3">
            {starters.map((starter) => (
              <li key={starter}>
                <Button type="button" variant="chip" size="lg" onClick={() => send(starter)} className="h-auto min-h-13.5 text-sm whitespace-normal">
                  {starter}
                </Button>
              </li>
            ))}
          </ul>
        </section>
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

      {/* Floats over the page like the reloadux.com ask bar; only the pill takes clicks. */}
      <form
        onSubmit={onSubmit}
        className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4"
      >
        <Label htmlFor="ask-question" className="sr-only">
          Ask about past projects
        </Label>
        <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-2 rounded-[1.8rem] border border-pill-border bg-pill px-3 py-2.5 shadow-[0_8px_32px_rgb(0_0_0/0.5)] focus-within:border-muted-foreground md:gap-3 md:px-4.5 md:py-3.5">
          <span aria-hidden className="rx-gradient-ring size-8 shrink-0 p-0.5 md:size-9.5">
            <span className="grid size-full place-items-center rounded-full bg-[#d9d9d9] text-xs font-extrabold text-black">UX</span>
          </span>
          <Textarea
            ref={inputRef}
            id="ask-question"
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Have we done a healthcare chatbot?"
            aria-describedby="ask-hint"
            className="max-h-48 min-h-0 rounded-none border-0 bg-transparent px-0 py-1 text-base focus-visible:ring-0 dark:bg-transparent md:text-base"
            rows={1}
            autoFocus
          />
          {busy ? (
            <Button type="button" variant="secondary" size="icon-lg" onClick={stop} aria-label="Stop" className="rounded-full bg-pill-border">
              <Square aria-hidden />
            </Button>
          ) : (
            <Button type="submit" variant="secondary" size="icon-lg" disabled={!question.trim()} aria-label="Ask" className="rounded-full bg-pill-border text-foreground disabled:opacity-40">
              <ArrowUp aria-hidden />
            </Button>
          )}
        </div>
        <p id="ask-hint" className="pointer-events-auto text-xs text-muted-foreground">
          Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}
