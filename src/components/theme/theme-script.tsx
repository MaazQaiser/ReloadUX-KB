import { THEME_STORAGE_KEY } from "@/lib/constants";

// Runs before first paint so the page never flashes the wrong theme.
const code = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

/** Applies the saved or system theme as a `.dark` class on <html>. Render once in <head>. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
