"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { PreviewBadge } from "@/components/preview-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnswerTurn } from "./answer-turn";
import { useAsk } from "./use-ask";

/** `name` is the signed-in person's first name, for the welcome; it may be missing. */
export function AskChat({ starters, name }: { starters: readonly string[]; name?: string }) {
  const { turns, ask, stop, busy } = useAsk();
  const [question, setQuestion] = useState("");
  const [focused, setFocused] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastState = turns.at(-1)?.state;
  const expanded = focused || question.trim() !== "" || busy;

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
        // The welcome fills the space above the ask bar, centred, until the first question.
        <section
          aria-labelledby="ask-welcome"
          className="rx-glow-band -mx-4 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6 text-center sm:-mx-8 sm:gap-10 sm:py-12"
        >
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <PreviewBadge />
            <h1 id="ask-welcome" className="max-w-3xl text-3xl leading-tight sm:text-5xl">
              {name ? `Hey ${name}, I'm here to help.` : "Hi, I'm here to help."}
            </h1>
            <p className="max-w-xl text-base text-soft-foreground sm:text-lg">
              Tell me what you&apos;re looking for and I&apos;ll find the relevant work.
            </p>
          </div>
          {/* One swipeable row on phones so the suggestions stay above the ask bar; wrapped and centred from sm up. */}
          <ul
            aria-label="Suggestions"
            className="-mx-4 flex w-[calc(100%+2rem)] max-w-none snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 py-2 sm:mx-0 sm:w-auto sm:max-w-3xl sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {starters.map((starter) => (
              <li key={starter} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => send(starter)}
                  className="rx-glass px-4 py-2 text-[13px] whitespace-nowrap text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <h1 className="sr-only">Ask about projects</h1>
          <ol className="flex flex-col gap-10" aria-label="Conversation">
            {turns.map((turn) => (
              <AnswerTurn key={turn.key} turn={turn} />
            ))}
          </ol>
        </>
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
        {/* Compact until someone clicks in, types or is waiting on an answer; then it opens up. */}
        <div
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
          className={cn(
            "pointer-events-auto flex w-full items-center rx-glow-stroke rounded-full border border-white/12 bg-[rgb(22_22_28/0.55)] backdrop-blur-2xl backdrop-saturate-150 transition-[max-width,padding,gap,border-color] duration-300 ease-out focus-within:border-white/25 motion-reduce:transition-none",
            expanded ? "max-w-3xl gap-3 px-3.5 py-2.5 md:px-4 md:py-3" : "max-w-md gap-2 px-2 py-1.5",
          )}
        >
          <span aria-hidden className={cn("rx-gradient-ring shrink-0 p-0.5 transition-[width,height] duration-300", expanded ? "size-9" : "size-7")}>
            <span className="grid size-full place-items-center rounded-full bg-[#d9d9d9] text-[10px] font-extrabold text-black">UX</span>
          </span>
          <Textarea
            ref={inputRef}
            id="ask-question"
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={expanded ? "Have we done a healthcare chatbot?" : "Ask about past projects…"}
            aria-describedby="ask-hint"
            className={cn(
              "max-h-48 min-h-0 resize-none rounded-none border-0 bg-transparent px-0 py-1 focus-visible:ring-0 dark:bg-transparent",
              expanded ? "text-base md:text-base" : "text-sm md:text-sm",
            )}
            rows={1}
          />
          {busy ? (
            <Button type="button" variant="secondary" size={expanded ? "icon-lg" : "icon"} onClick={stop} aria-label="Stop" className="rounded-full bg-white/10">
              <Square aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="secondary"
              size={expanded ? "icon-lg" : "icon"}
              disabled={!question.trim()}
              aria-label="Ask"
              className="rounded-full bg-white/10 text-foreground disabled:opacity-40"
            >
              <ArrowUp aria-hidden />
            </Button>
          )}
        </div>
        <p id="ask-hint" className={cn("pointer-events-auto text-xs text-muted-foreground", !expanded && "sr-only")}>
          Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}
