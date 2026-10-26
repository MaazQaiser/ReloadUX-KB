import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  // Pulse: every button is a pill; filled ones lift 2px on hover and press to 96%.
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all duration-300 ease-pulse outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/15 active:not-aria-[haspopup]:scale-96 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none aria-invalid:ring-4 aria-invalid:ring-destructive/20 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg[data-icon=inline-end]]:transition-transform hover:[&_svg[data-icon=inline-end]]:translate-x-0.5",
  {
    variants: {
      variant: {
        // Ink fill (black in light mode, white in dark); violet never fills a button.
        default:
          "bg-primary text-primary-foreground shadow-pulse-soft hover:-translate-y-0.5 hover:shadow-pulse-soft-lg motion-reduce:hover:translate-y-0",
        outline:
          "border-border bg-transparent text-foreground hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground aria-expanded:bg-primary aria-expanded:text-primary-foreground motion-reduce:hover:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)]",
        ghost:
          "text-foreground/70 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        link: "text-foreground/60 underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        // Pulse's closing call to action: bold, a little roomier.
        lg: "h-12 gap-2 px-7 font-bold has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
