"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "./icons";
import { cx } from "./cx";

// Theme handling that matches the app (next-themes, attribute="class",
// defaultTheme="system"): a `.dark` class on <html>, the choice saved in
// localStorage under "theme". Because it uses the same class and key, it
// interoperates with next-themes — or pass `isDark`/`onToggle` to ThemeToggle
// and drive it from your own provider.

const STORAGE_KEY = "theme";

/**
 * Inline script for <head> that applies the saved/system theme before first
 * paint (no flash). Render once in your root layout. Skip it if you already
 * use next-themes.
 */
export function PulseThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

function subscribeToHtmlClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/**
 * Reads and sets the `.dark` class on <html>; stays in sync with any other
 * toggler (next-themes included). `isDark` is undefined during SSR/hydration.
 */
export function usePulseTheme() {
  const isDark = useSyncExternalStore<boolean | undefined>(
    subscribeToHtmlClass,
    () => document.documentElement.classList.contains("dark"),
    () => undefined
  );

  const setTheme = useCallback((theme: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable (private mode) — the class change still applies
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return { isDark, setTheme, toggle };
}

/**
 * The round ink theme button. `floating` = fixed bottom-right (landing page);
 * `header` = 36px inline (app header). Shows Sun in light mode, Moon in dark.
 */
export function ThemeToggle({
  variant = "floating",
  isDark: controlledDark,
  onToggle,
  className,
}: {
  variant?: "floating" | "header";
  /** Controlled mode (e.g. from next-themes' resolvedTheme === "dark"). */
  isDark?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  const own = usePulseTheme();
  const isDark = controlledDark ?? own.isDark;
  // Nothing inside until after hydration, so server and client markup match.
  const mounted = isDark !== undefined;

  return (
    <motion.button
      type="button"
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={onToggle ?? own.toggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.92 }}
      className={cx("rx-theme-toggle", `rx-theme-toggle--${variant}`, className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isDark ? <Moon strokeWidth={1.5} /> : <Sun strokeWidth={1.5} />}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
