import type { Metadata } from "next";
import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";
import { getIntegrations } from "@/env";
import { Skeleton } from "@/components/ui/skeleton";
import { STARTER_QUESTIONS } from "@/lib/constants";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "home" };

/** Home is the chat: a centred welcome with suggestions, then the conversation. */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<HomeSkeleton />}>
        <SignedInHome />
      </Suspense>
    </div>
  );
}

async function SignedInHome() {
  const user = await requireRole("viewer");
  // Without Claude the answers are canned, and the screen says so.
  return <AskChat starters={STARTER_QUESTIONS} name={firstName(user.name)} preview={!getIntegrations().anthropic} />;
}

/** Names come from Google; an email address in its place isn't a name to greet. */
function firstName(name: string): string | undefined {
  const first = name.trim().split(/\s+/)[0];
  return first && !first.includes("@") ? first : undefined;
}

function HomeSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col items-center justify-center gap-4">
      <Skeleton className="h-12 w-full max-w-lg" />
      <Skeleton className="h-5 w-full max-w-sm" />
    </div>
  );
}
