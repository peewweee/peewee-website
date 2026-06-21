import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Badge / chip — tags, citation chips, status pills. Theme-aware accent. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill font-sans font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-[rgba(var(--accent-glow),0.5)] bg-[rgba(var(--accent-glow),0.08)] text-accent-text",
        solid: "bg-gold text-gold-ink shadow-glow-sm",
        muted: "border border-border-strong bg-surface text-foreground-muted",
        outline: "border border-border-strong text-foreground-muted",
        success:
          "border border-[var(--success)] bg-[rgba(87,190,137,0.1)] text-[var(--success)]",
        warning:
          "border border-[var(--warning)] bg-[rgba(224,169,59,0.1)] text-[var(--warning)]",
        danger:
          "border border-[var(--danger)] bg-[rgba(233,122,112,0.1)] text-[var(--danger)]",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        default: "px-3.5 py-1.5 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
