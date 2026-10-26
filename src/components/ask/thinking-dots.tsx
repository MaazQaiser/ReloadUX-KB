/** Three dots that bounce in turn while an answer is on its way. */
export function ThinkingDots() {
  return (
    <span aria-hidden className="inline-flex gap-1">
      {["0ms", "150ms", "300ms"].map((delay) => (
        <span
          key={delay}
          className="block size-1.5 animate-thinking-dot rounded-full bg-foreground/40 motion-reduce:animate-none"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}
