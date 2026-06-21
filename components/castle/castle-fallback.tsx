import Link from "next/link";

import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Decorative low-poly night-castle silhouette. Pure SVG, no image payload.
 * Shown as the 2D fallback's backdrop (and behind the 3D loading skeleton).
 */
export function CastleSilhouette({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full opacity-60"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg-elev)" />
            <stop offset="100%" stopColor="var(--bg-sunken)" />
          </linearGradient>
          <radialGradient id="moon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(var(--accent-glow),0.9)" />
            <stop offset="100%" stopColor="rgba(var(--accent-glow),0)" />
          </radialGradient>
        </defs>
        <rect width="800" height="400" fill="url(#sky)" />
        <circle cx="640" cy="90" r="70" fill="url(#moon)" />
        <circle cx="640" cy="90" r="26" fill="rgba(244,236,216,0.85)" />

        {/* Castle body + towers */}
        <g
          fill="var(--bg-sunken)"
          stroke="rgba(var(--accent-glow),0.35)"
          strokeWidth="1.5"
        >
          <rect x="120" y="250" width="560" height="150" />
          <rect x="150" y="180" width="70" height="220" />
          <rect x="360" y="140" width="90" height="260" />
          <rect x="580" y="190" width="70" height="210" />
          <polygon points="150,180 185,120 220,180" />
          <polygon points="360,140 405,70 450,140" />
          <polygon points="580,190 615,130 650,190" />
        </g>

        {/* Glowing windows */}
        <g fill="rgba(var(--accent-glow),0.9)">
          <rect x="175" y="210" width="10" height="16" rx="2" />
          <rect x="398" y="180" width="12" height="20" rx="2" />
          <rect x="605" y="225" width="10" height="16" rx="2" />
          <rect x="300" y="300" width="10" height="20" rx="2" />
          <rect x="490" y="300" width="10" height="20" rx="2" />
          <rect x="390" y="300" width="20" height="40" rx="3" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-bg-sunken via-transparent to-transparent" />
    </div>
  );
}

/**
 * The accessible "tower" navigation — a real <nav> of links. This ALWAYS renders
 * (under the 3D canvas when present, or as the 2D fallback's primary nav), so
 * keyboard and assistive-tech users never depend on WebGL.
 */
export function CastleTowerNav({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Castle towers"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-start gap-3 rounded-card border border-border bg-surface p-4 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-card focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-pill bg-bg-sunken text-xl shadow-glow-sm transition-transform group-hover:scale-110"
          >
            {item.glyph}
          </span>
          <span className="flex flex-col">
            <span className="font-display text-base font-bold text-accent-text">
              {item.tower}
            </span>
            <span className="text-xs text-foreground-muted">{item.description}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
