import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button — matches the design system's "wax-seal" primary, outline secondary,
 * and ghost styles, including hover / active / focus / disabled / loading states.
 * Theme-aware: outline + glow follow the active `--accent` (house theming).
 */
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill font-sans text-sm font-semibold transition-all duration-200 ease-float focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40 disabled:grayscale [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Gold "wax-seal" primary
        primary:
          "bg-gold text-gold-ink shadow-glow hover:-translate-y-px hover:bg-gold-hover hover:shadow-glow-lg active:translate-y-0 active:bg-gold-press",
        // Outline / secondary — follows the accent
        secondary:
          "border-[1.5px] border-accent bg-transparent text-accent-text hover:bg-[rgba(var(--accent-glow),0.12)] hover:shadow-glow active:bg-[rgba(var(--accent-glow),0.2)]",
        // Quiet ghost
        ghost:
          "bg-transparent text-foreground-muted hover:bg-surface hover:text-accent-text",
        // Inline text link
        link: "text-accent-text underline-offset-4 hover:underline",
        // Destructive
        danger:
          "bg-[var(--danger)] text-[#1a0e0c] hover:brightness-110 active:brightness-95",
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs",
        default: "px-[22px] py-[11px]",
        lg: "px-7 py-3 text-[15px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    // When asChild is set, the child must be a single element; render it as-is
    // (no spinner injection) to keep Slot's single-child contract.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
