import Link from "next/link";

import { navItems } from "@/lib/site";
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CastleHubProps {
  /**
   * Tower destinations to render. Each becomes a clickable tower in the 3D
   * scene (Phase 2) and an accessible link card in the 2D fallback (now).
   * Defaults to the site's primary nav.
   */
  items?: NavItem[];
  /**
   * Optional extra classes for the outer section.
   */
  className?: string;
}

/**
 * CastleHub — the navigation hub. **Phase 2 STUB.**
 *
 * Today it renders the **2D fallback**: a decorative night-castle silhouette
 * (aria-hidden) plus an accessible grid of "tower" links. This same fallback is
 * the permanent path for mobile, weak GPUs, no-WebGL browsers, and reduced
 * motion — the 3D castle is only ever an enhancement layered on top.
 *
 * TODO (Phase 2): lazy-load a React Three Fiber `<CastleScene items={items} />`
 * after first paint (dynamic import, ssr:false). It must consume shared tokens
 * (gold --accent / --accent-glow for tower highlights, per-house glow triplets
 * for Get Sorted, --bg/--bg-sunken for the night sky, the motion easings for
 * camera glides) and fall back to this markup when WebGL is unavailable.
 */
export function CastleHub({ items = navItems, className }: CastleHubProps) {
  return (
    <section
      aria-labelledby="castle-hub-heading"
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-bg-sunken",
        className,
      )}
      // 3D mount point — the R3F canvas will mount into this region in Phase 2.
      data-castle-mount="3d"
    >
      {/* Decorative 2D castle silhouette (replaced/overlaid by R3F in Phase 2) */}
      <CastleSilhouette />

      <div className="relative z-10 p-6 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          The Castle · navigation
        </p>
        <h2
          id="castle-hub-heading"
          className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl"
        >
          Choose a tower
        </h2>
        <p className="mt-2 max-w-prose text-sm text-foreground-muted">
          An interactive 3D castle will live here. Until then — and always, for keyboard
          and assistive-tech users — every destination is one click away below.
        </p>

        <nav
          aria-label="Castle towers"
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
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
      </div>
    </section>
  );
}

/** Lightweight decorative night-castle. Pure SVG, no image payload. */
function CastleSilhouette() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
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
