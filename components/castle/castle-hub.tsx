"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Box, Boxes, ChevronDown, Sparkles } from "lucide-react";

import { navItems, siteConfig } from "@/lib/site";
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCastle3D } from "@/lib/use-preference";
import { CastleSilhouette, CastleTowerNav } from "./castle-fallback";

// Heavy three.js bundle — code-split and loaded client-side only, on demand.
// (Keep ALL @react-three/* imports inside this lazy module, never in the hub.)
const CastleScene = dynamic(() => import("./castle-scene").then((m) => m.CastleScene), {
  ssr: false,
  loading: () => <CastleSkeleton label="Summoning the castle…" />,
});

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export interface CastleHubProps {
  /** Tower destinations. Defaults to the site's primary nav. */
  items?: NavItem[];
  className?: string;
  /**
   * "hero" → the full-screen, pinned, scroll-driven castle landing (the home
   * page). "card" → the bounded card with a heading + accessible tower nav.
   */
  variant?: "hero" | "card";
}

/**
 * CastleHub — the navigation hub (Phase 2).
 *
 * 3D castle on eligible devices (WebGL + motion-allowed + opt-in), 2D otherwise.
 * The header nav is always the accessible/keyboard path, so the castle is purely
 * an enhancement.
 */
export function CastleHub({
  items = navItems,
  className,
  variant = "card",
}: CastleHubProps) {
  if (variant === "hero") {
    return <CastleHero items={items} className={className} />;
  }
  return <CastleCard items={items} className={className} />;
}

/* ============================================================================
   Hero variant — full-screen, pinned; scrolling drives the camera "dive" into
   the keep (the Great Hall), then hands off to the hero section below.
   ============================================================================ */
function CastleHero({ items, className }: { items: NavItem[]; className?: string }) {
  const { show3D, enabled, setEnabled, eligible } = useCastle3D();
  const sectionRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const descendRef = React.useRef(0);
  const invalidateRef = React.useRef<() => void>(() => {});

  const enterGreatHall = React.useCallback(() => {
    document.getElementById("great-hall")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll → descent (3D only). Map progress through the tall pinned section to
  // descendRef (0→1) and fade the pinned stage out near the end so it cross-fades
  // into the Great Hall section.
  React.useEffect(() => {
    if (!show3D) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const d = total > 0 ? clamp01(-rect.top / total) : 0;
      descendRef.current = d;
      if (stage) {
        const fade = d <= 0.65 ? 1 : Math.max(1 - (d - 0.65) / 0.35, 0);
        stage.style.opacity = String(fade);
        stage.style.pointerEvents = fade < 0.05 ? "none" : "";
      }
      invalidateRef.current();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [show3D]);

  const tall = show3D; // only the 3D scene scrubs; 2D is a single static screen

  return (
    <section
      ref={sectionRef}
      aria-label="The castle — site navigation"
      data-castle-mount="3d"
      className={cn(
        "relative w-full",
        tall ? "h-[220vh]" : "min-h-[calc(100svh-4rem)]",
        className,
      )}
    >
      <div
        ref={stageRef}
        className={cn(
          "overflow-hidden",
          tall ? "sticky top-16 h-[calc(100svh-4rem)]" : "relative h-[calc(100svh-4rem)]",
        )}
      >
        <div className="absolute inset-0">
          {show3D ? (
            <SceneBoundary fallback={<CastleSilhouette />}>
              <CastleScene
                items={items}
                descendRef={descendRef}
                onEnterGreatHall={enterGreatHall}
                onReady={(fn) => {
                  invalidateRef.current = fn;
                  fn();
                }}
              />
            </SceneBoundary>
          ) : (
            <CastleSilhouette />
          )}
        </div>

        {/* Title overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-4 pt-[12vh] text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-text">
            {siteConfig.name}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-foreground [text-shadow:0_2px_24px_rgba(0,0,0,0.65)] sm:text-6xl">
            Welcome to my Castle
          </h1>
        </div>

        {/* Scroll / explore hint */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-foreground-muted">
          <span className="text-[11px] uppercase tracking-[0.2em]">
            {show3D ? "Click a tower · scroll to enter" : "Use the menu to explore"}
          </span>
          <ChevronDown className="size-5 animate-bounce text-accent-text" aria-hidden />
        </div>

        {/* 2D/3D toggle */}
        {eligible && (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            aria-pressed={show3D}
            className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-[rgba(11,16,38,0.7)] px-3 py-1.5 text-xs font-semibold text-foreground-muted backdrop-blur transition-all hover:border-accent hover:text-accent-text focus-visible:shadow-focus focus-visible:outline-none"
          >
            {show3D ? <Box className="size-3.5" /> : <Boxes className="size-3.5" />}
            {show3D ? "2D view" : "3D view"}
          </button>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
   Card variant — bounded castle + heading + accessible tower nav (reusable).
   ============================================================================ */
function CastleCard({ items, className }: { items: NavItem[]; className?: string }) {
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

        {eligible && (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            aria-pressed={show3D}
            className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-[rgba(11,16,38,0.7)] px-3 py-1.5 text-xs font-semibold text-foreground-muted backdrop-blur transition-all hover:border-accent hover:text-accent-text focus-visible:shadow-focus focus-visible:outline-none"
          >
            {show3D ? <Box className="size-3.5" /> : <Boxes className="size-3.5" />}
            {show3D ? "2D view" : "3D view"}
          </button>
        )}
      </div>

      <div className="mt-6">
        <h2
          id="castle-hub-heading"
          className="font-display text-2xl font-bold text-foreground sm:text-3xl"
        >
          Choose a tower
        </h2>
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
