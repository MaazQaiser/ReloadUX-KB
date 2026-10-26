import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base transition-all duration-300 outline-none hover:bg-muted/50 placeholder:text-pulse-muted focus-visible:border-foreground/40 focus-visible:bg-transparent focus-visible:ring-4 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
