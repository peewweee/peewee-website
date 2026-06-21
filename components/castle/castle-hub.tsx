"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Box, Boxes, Sparkles } from "lucide-react";

import { navItems } from "@/lib/site";
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCastle3D } from "@/lib/use-preference";
import { CastleSilhouette, CastleTowerNav } from "./castle-fallback";

// Heavy three.js bundle — code-split and loaded client-side only, on demand.
const CastleScene = dynamic(() => import("./castle-scene").then((m) => m.CastleScene), {
  ssr: false,
  loading: () => <CastleSkeleton label="Summoning the castle…" />,
});

export interface CastleHubProps {
  /** Tower destinations. Defaults to the site's primary nav. */
  items?: NavItem[];
  className?: string;
}

/**
 * CastleHub — the navigation hub (Phase 2).
 *
 * Renders the interactive 3D castle on eligible devices (desktop pointer +
 * WebGL + motion allowed + user opt-in), and the 2D silhouette otherwise. The
 * accessible tower nav (`CastleTowerNav`) ALWAYS renders beneath, so keyboard
 * and assistive-tech users never depend on WebGL. A toggle lets anyone switch
 * between 3D and 2D; an error boundary drops to 2D if the scene fails.
 */
export function CastleHub({ items = navItems, className }: CastleHubProps) {
  const { show3D, enabled, setEnabled, eligible } = useCastle3D();

  return (
    <section
      aria-labelledby="castle-hub-heading"
      className={cn("relative", className)}
      data-castle-mount="3d"
    >
      <div className="relative h-[440px] overflow-hidden rounded-card border border-border bg-bg-sunken sm:h-[520px]">
        {show3D ? (
          <SceneBoundary
            fallback={<CastleSkeleton label="3D unavailable — showing the 2D castle" />}
          >
            <CastleScene items={items} />
          </SceneBoundary>
        ) : (
          <CastleSilhouette />
        )}

        {/* 2D/3D toggle — only meaningful when the device can do 3D */}
        {eligible && (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            aria-pressed={show3D}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-[rgba(11,16,38,0.7)] px-3 py-1.5 text-xs font-semibold text-foreground-muted backdrop-blur transition-all hover:border-accent hover:text-accent-text focus-visible:shadow-focus focus-visible:outline-none"
          >
            {show3D ? <Box className="size-3.5" /> : <Boxes className="size-3.5" />}
            {show3D ? "2D view" : "3D view"}
          </button>
        )}
      </div>

      <div className="mt-6">
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
          {show3D
            ? "Hover a tower and click to travel. Prefer text? Every destination is listed below — and fully keyboard-navigable."
            : "Every destination is one click away below — always available, for keyboard and assistive-tech users too."}
        </p>

        <CastleTowerNav items={items} className="mt-6" />
      </div>
    </section>
  );
}

/** Themed loading / fallback panel: the silhouette plus a small shimmer label. */
function CastleSkeleton({ label }: { label: string }) {
  return (
    <div className="absolute inset-0">
      <CastleSilhouette />
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-[rgba(11,16,38,0.7)] px-3 py-1.5 text-xs text-foreground-muted backdrop-blur">
          <Sparkles className="size-3.5 animate-candle text-accent-text" aria-hidden />
          {label}
        </span>
      </div>
    </div>
  );
}

/** Drops to the 2D fallback if the 3D scene throws (e.g. lost WebGL context). */
class SceneBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
