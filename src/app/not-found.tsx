import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <StatusScreen
        eyebrow="404"
        title="Page not found"
        description="There's nothing at this address."
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
