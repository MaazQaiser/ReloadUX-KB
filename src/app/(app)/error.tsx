"use client";

import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusScreen
      role="alert"
      eyebrow="Error"
      title="Something went wrong"
      description="We couldn't load this page. It's been logged; try again in a moment."
      action={
        <Button size="lg" variant="outline" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
