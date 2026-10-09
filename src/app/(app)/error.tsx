"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-12">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        We couldn&apos;t load this page. It&apos;s been logged; try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
