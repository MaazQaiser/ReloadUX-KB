import type { Metadata } from "next";
import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";
import { Eyebrow } from "@/components/page-header";
import { PreviewBadge } from "@/components/preview-badge";
import { STARTER_QUESTIONS } from "@/lib/constants";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "home" };

/** Home is the chat: a greeting, suggestions to get started, and the ask box. */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <Suspense fallback={<Greeting />}>
        <SignedInHome />
      </Suspense>
    </div>
  );
}

async function SignedInHome() {
  const user = await requireRole("viewer");
  return (
    <>
      <Greeting name={firstName(user.name)} />
      <AskChat starters={STARTER_QUESTIONS} />
    </>
  );
}

/** Names come from Google; fall back to a plain hello when the name is an email address. */
function firstName(name: string): string | undefined {
  const first = name.trim().split(/\s+/)[0];
  return first && !first.includes("@") ? first : undefined;
}

function Greeting({ name }: { name?: string }) {
  return (
    <div className="flex flex-col gap-6 border-b pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-4">
        <Eyebrow>Welcome</Eyebrow>
        <h1 className="text-4xl leading-tight sm:text-6xl">{name ? `Hi ${name}, what have we built?` : "Hi, what have we built?"}</h1>
        <p className="text-lg text-soft-foreground">
          Ask about any past reloadux project in plain words, or start with a suggestion below. Answers begin with Yes,
          Partly or No and link to the projects they came from.
        </p>
      </div>
      <PreviewBadge />
    </div>
  );
}
