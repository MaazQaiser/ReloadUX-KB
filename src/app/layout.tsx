import type { Metadata } from "next";
import { Geist_Mono, Libre_Baskerville, Manrope } from "next/font/google";
import "./globals.css";

// The reloadux.com pairing: Manrope for interface text, Libre Baskerville for headings.
const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const baskerville = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "variable",
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
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
