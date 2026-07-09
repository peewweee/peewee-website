"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * MagicCard (ported from magicui.design, themed to our gold + blue palette).
 *
 * On hover the card's border becomes a soft yellow→blue gradient that follows the
 * cursor, with a gentle inner spotlight. At rest it's an ordinary bordered card:
 * the border layer is a full-bleed radial that reads as `--border` everywhere
 * except under the cursor, and an inset-px surface covers all but a 1px rim — so
 * that rim *is* the (gradient) border.
 */
interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  /** Diameter (px) of the cursor gradient. */
  gradientSize?: number;
  /** Inner spotlight colour — kept subtle (alpha baked in). */
  gradientColor?: string;
  /** Border gradient endpoints — our yellow → blue. */
  gradientFrom?: string;
  gradientTo?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientColor = "rgba(212, 175, 55, 0.15)",
  gradientFrom = "#e8c766",
  gradientTo = "#4f83e8",
}: MagicCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const { left, top } = el.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  // Park the gradient off-card so the rim falls back to the plain border colour.
  const reset = React.useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [mouseX, mouseY, gradientSize]);

  const border = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, var(--border) 100%)`;
  const spotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={cn("group relative rounded-card", className)}
    >
      {/* gradient border rim (reads as --border away from the cursor) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: border }}
      />
      {/* card surface — covers all but the 1px rim */}
      <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-bg-sunken" />
      {/* inner spotlight, fades in on hover */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
