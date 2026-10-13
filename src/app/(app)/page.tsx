import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectIntake } from "@/components/admin-chat/project-intake";
import { AskChat } from "@/components/ask/ask-chat";
import { PageHeader } from "@/components/page-header";
import { PreviewBadge } from "@/components/preview-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrations } from "@/env";
import { hasRole } from "@/lib/auth-rules";
import { STARTER_QUESTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/auth";

export const metadata: Metadata = { title: "home" };

type Mode = "ask" | "add";

const MODES: { mode: Mode; label: string; href: string }[] = [
  { mode: "ask", label: "Ask about projects", href: "/" },
  { mode: "add", label: "Add or edit a project", href: "/?mode=add" },
];

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <PageHeader
        eyebrow="Home"
        title="What have we built?"
        description="Ask about past projects in plain words. Answers start with Yes, Partly or No, and link to the records they used."
        actions={<PreviewBadge />}
      />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HomeView({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireRole("viewer");
  const isEditor = hasRole(user.role, "editor");
  // Adding and editing is for editors; anyone else asking for it just gets Ask.
  const mode: Mode = isEditor && (await searchParams).mode === "add" ? "add" : "ask";

  return (
    <>
      {isEditor && (
        <nav aria-label="Home mode" className="-mt-4 flex gap-8 border-b">
          {MODES.map((item) => (
            <Link
              key={item.mode}
              href={item.href}
              aria-current={item.mode === mode ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 border-transparent pb-3 text-soft-foreground transition-colors hover:text-foreground",
                item.mode === mode && "border-foreground text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {mode === "add" ? <ProjectIntake anthropic={getIntegrations().anthropic} /> : <AskChat starters={STARTER_QUESTIONS} />}
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-px sm:grid-cols-2">
        {STARTER_QUESTIONS.map((starter) => (
          <Skeleton key={starter} className="h-20" />
        ))}
      </div>
    </div>
  );
}
