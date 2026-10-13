import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "no access" };

export default function ForbiddenPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <StatusScreen
        eyebrow="No access"
        title="You don't have access to this page"
        description="Ask an admin if you need a different role."
        action={
          <Link href="/projects" className={buttonVariants({ size: "lg" })}>
            Go to projects
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        }
      />
    </main>
  );
}
