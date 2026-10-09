import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Wordmark } from "@/components/wordmark";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "reloadux project intelligence",
  description: "Ask about past reloadux projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
            <Wordmark />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
