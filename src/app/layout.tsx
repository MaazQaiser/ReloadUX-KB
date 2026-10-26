import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

// Pulse's pairing, from the design system's own files so nothing is fetched at runtime:
// Manrope for everything, Libre Baskerville only for display lines and report headings.
const manrope = localFont({
  variable: "--font-sans",
  src: [
    { path: "../../pulse-design-system/assets/fonts/woff2/manrope-latin-300-normal.woff2", weight: "300" },
    { path: "../../pulse-design-system/assets/fonts/woff2/manrope-latin-400-normal.woff2", weight: "400" },
    { path: "../../pulse-design-system/assets/fonts/woff2/manrope-latin-500-normal.woff2", weight: "500" },
    { path: "../../pulse-design-system/assets/fonts/woff2/manrope-latin-700-normal.woff2", weight: "700" },
  ],
});

const baskerville = localFont({
  variable: "--font-serif",
  src: [
    { path: "../../pulse-design-system/assets/fonts/woff2/libre-baskerville-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../pulse-design-system/assets/fonts/woff2/libre-baskerville-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../pulse-design-system/assets/fonts/woff2/libre-baskerville-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../pulse-design-system/assets/fonts/woff2/libre-baskerville-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "reloadux project intelligence", template: "%s · reloadux" },
  description: "Ask about past reloadux projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${baskerville.variable} ${geistMono.variable} h-full antialiased`}
      // ThemeScript adds `.dark` before React hydrates, so the class differs from the server's.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
