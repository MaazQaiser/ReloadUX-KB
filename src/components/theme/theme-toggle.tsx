"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function toggleTheme() {
  const dark = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Private mode can block storage; the switch still applies for this visit.
  }
}

/** Pulse's round ink theme button: sun in light mode, moon in dark. */
export function ThemeToggle({ className }: { className?: string }) {
  // Unknown on the server, so the icon appears only after hydration and the markup matches.
  const isDark = useSyncExternalStore<boolean | undefined>(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => undefined,
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark === undefined ? "Toggle theme" : `Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-pulse-ink text-pulse-surface shadow-pulse-soft transition-transform duration-200 ease-pulse outline-none hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-ring/20 active:scale-92 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {isDark !== undefined &&
        (isDark ? (
          <Moon className="size-4 animate-in spin-in-90 fade-in-0 duration-250" strokeWidth={1.5} aria-hidden />
        ) : (
          <Sun className="size-4 animate-in spin-in-90 fade-in-0 duration-250" strokeWidth={1.5} aria-hidden />
        ))}
    </button>
  );
}
