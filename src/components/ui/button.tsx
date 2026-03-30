"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: touch-friendly (min 44px height via line-height), font from design system, press animation
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold select-none cursor-pointer " +
  "transition-all duration-100 ease-out " +
  "active:scale-[0.97] active:opacity-90 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 " +
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Gold CTA — primary brand action
        default:
          "rounded-full bg-primary text-primary-foreground shadow-[0_2px_8px_oklch(0.769_0.188_70/0.28)] " +
          "hover:brightness-105 hover:shadow-[0_4px_16px_oklch(0.769_0.188_70/0.38)]",
        // Destructive
        destructive:
          "rounded-lg bg-destructive text-white hover:bg-destructive/90 " +
          "focus-visible:ring-destructive/20 dark:bg-destructive/60",
        // Navy-tinted outline — secondary action
        outline:
          "rounded-lg border border-border bg-background " +
          "hover:bg-navy-50 hover:border-navy-200 " +
          "dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        // Subtle fill — tertiary action
        secondary:
          "rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70",
        // Ghost — nav items, icon buttons
        ghost:
          "rounded-lg hover:bg-navy-50 hover:text-navy-900 dark:hover:bg-navy-900/30",
        // Link style
        link: "rounded-sm text-primary underline-offset-4 hover:underline",
        // Navy filled — for alternate CTAs
        navy:
          "rounded-full bg-navy-900 text-white shadow-sm " +
          "hover:bg-navy-800 hover:shadow-md",
      },
      size: {
        default: "h-11 min-h-[44px] px-5 py-2.5 has-[>svg]:px-4",
        xs:      "h-7 min-h-[28px] gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-9 min-h-[36px] gap-1.5 px-4 has-[>svg]:px-3",
        lg:      "h-12 min-h-[48px] px-7 text-base has-[>svg]:px-5",
        icon:    "size-11 min-h-[44px] min-w-[44px] rounded-full",
        "icon-xs": "size-7 min-h-[28px] rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 min-h-[36px] rounded-full",
        "icon-lg": "size-12 min-h-[48px] rounded-full",
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
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading && <Loader2 className="animate-spin shrink-0" style={{ width: "1em", height: "1em" }} />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
