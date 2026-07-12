"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Sparkles } from "lucide-react";

import { navItems } from "@/lib/site";
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCastle3D } from "@/lib/use-preference";
import { CastleSilhouette, CastleTowerNav } from "./castle-fallback";
import { CastleBrewing } from "./castle-brewing";

// Heavy three.js bundle — code-split and loaded client-side only, on demand.
// (Keep ALL @react-three/* imports inside this lazy module, never in the hub.)
// While the chunk loads we render nothing (the dark page background shows) — no
// 2D silhouette, so returning to the home page never flashes a flat castle.
const CastleScene = dynamic(() => import("./castle-scene").then((m) => m.CastleScene), {
  ssr: false,
  loading: () => null,
});

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export interface CastleHubProps {
  /** Tower destinations. Defaults to the site's primary nav. */
  items?: NavItem[];
  className?: string;
  /**
   * "hero" → the full-screen 3D castle landing (the home page). "card" → the
   * bounded card with a heading + accessible tower nav.
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
   Hero variant — the full-screen 3D castle (home page). It IS the navigation:
   each tower zooms in + warps to its route. Header nav is the a11y fallback.
   ============================================================================ */
function CastleHero({ items, className }: { items: NavItem[]; className?: string }) {
  const descendRef = React.useRef(0);
  const invalidateRef = React.useRef<() => void>(() => {});
  const titleRef = React.useRef<HTMLDivElement>(null);

  // ── 2D "brewing" loader ───────────────────────────────────────────────────
  // Covers the blank gap before the 3D castle paints — but ONLY for plain /
  // first-visit entries. Back-to-castle arrivals already have the iris covering
  // the load, so we skip it there. wiz:reveal is read in the INITIAL state (during
  // render, before PortalTransition consumes it in a layout effect) so it's
  // race-free; we only read it here, never clear it.
  const [cameViaWindow] = React.useState(() => {
    try {
      return sessionStorage.getItem("wiz:reveal") === "in";
    } catch {
      return false;
    }
  });
  const [brewing, setBrewing] = React.useState(!cameViaWindow);
  const brewTimer = React.useRef<number | undefined>(undefined);
  // Hard fallback so the loader can never stick (e.g. WebGL fails and the scene
  // never reports ready).
  React.useEffect(() => {
    if (!brewing) return;
    const t = window.setTimeout(() => setBrewing(false), 6000);
    return () => window.clearTimeout(t);
  }, [brewing]);
  React.useEffect(
    () => () => {
      if (brewTimer.current !== undefined) window.clearTimeout(brewTimer.current);
    },
    [],
  );
  // Scene is set up → keep the invalidate handle AND fade the loader out after a
  // beat so the demand loop has actually painted the castle first.
  const handleReady = React.useCallback((fn: () => void) => {
    invalidateRef.current = fn;
    fn();
    if (brewTimer.current === undefined) {
      brewTimer.current = window.setTimeout(() => setBrewing(false), 650);
    }
  }, []);

  // Scroll drives the camera TOUR and LOOPS: wheel/touch accumulate descendRef
  // (the value shared with the scene), wrapping 0→1→0, so reaching the original
  // POV and scrolling on simply restarts the tour (TOUR starts and ends at the
  // same wide pose, so the wrap is seamless). descendRef is the single source of
  // truth — not a private counter — so when the scene's back-to-castle intro
  // SEEDS it at the tower we returned to, scrolling resumes from there with no
  // snap. The page itself never scrolls (home IS the castle), so this hijacks
  // wheel/touch; keyboard users navigate via the header nav.
  React.useEffect(() => {
    const LOOP_PX = 9000; // wheel pixels for one full loop of the tour
    const FADE_OUT = 0.05; // scroll range to fade the title OUT (leaving the wide view)
    const FADE_IN = 0.03; // scroll range to fade it back IN (returning after the tour)
    let raf = 0;
    const apply = () => {
      raf = 0;
      const d = ((descendRef.current % 1) + 1) % 1; // wrap to [0, 1)
      descendRef.current = d;
      if (titleRef.current) {
        // Fade out leaving the wide view (d rising from 0) and back in returning
        // to it (d approaching 1) — d=0 and d=1 are the same wide pose. Each side
        // uses its own range.
        const edge = Math.min(d, 1 - d);
        const range = d < 0.5 ? FADE_OUT : FADE_IN;
        titleRef.current.style.opacity = String(1 - clamp01(edge / range));
      }
      invalidateRef.current();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    // Accumulate onto descendRef, keeping it normalized so the scene (which
    // clamps, not wraps) never sees an out-of-range value mid-loop.
    const bump = (delta: number) => {
      descendRef.current = (((descendRef.current + delta) % 1) + 1) % 1;
      schedule();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      bump(e.deltaY / LOOP_PX);
    };
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? 0;
      bump(((lastY - y) * 2.2) / LOOP_PX);
      lastY = y;
    };
    // Paint now, then again on the next couple of beats so the title syncs once
    // the lazy-mounted scene has seeded descendRef (return-from-page intro).
    apply();
    const t1 = window.setTimeout(schedule, 260);
    const t2 = window.setTimeout(schedule, 950);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      aria-label="The castle — site navigation"
      data-castle-mount="3d"
      className={cn(
        "relative h-[calc(100svh-4rem)] w-full overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0">
        {/* Only ever the 3D castle — no 2D silhouette to flash on (re)mount. */}
        <SceneBoundary fallback={null}>
          <CastleScene items={items} descendRef={descendRef} onReady={handleReady} />
        </SceneBoundary>
      </div>

      {/* Title overlay — aligned to the header container (same left as the logo);
          two lines; fades on scroll */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[4vh]"
      >
        <div className="container">
          <h1 className="font-display text-6xl font-bold leading-tight text-foreground [text-shadow:0_2px_24px_rgba(0,0,0,0.7)] sm:text-7xl">
            Welcome,
            <br />
            wizard!
          </h1>
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-foreground-muted">
        <span className="text-[11px] uppercase tracking-[0.2em]">
          Scroll to tour · click a tower to enter
        </span>
        <ChevronDown className="size-5 animate-bounce text-accent-text" aria-hidden />
      </div>

      {/* 2D brewing loader — plain / first-visit entries only (skipped for the
          back-to-castle iris, which already covers the load). */}
      {!cameViaWindow && <CastleBrewing done={!brewing} />}
    </section>
  );
}

/* ============================================================================
   Card variant — bounded castle + heading + accessible tower nav (reusable).
   ============================================================================ */
function CastleCard({ items, className }: { items: NavItem[]; className?: string }) {
  const { show3D } = useCastle3D();

  return (
    <section
      aria-labelledby="castle-hub-heading"
      className={cn("relative", className)}
      data-castle-mount="3d"
    >
      <div className="relative h-[440px] overflow-hidden rounded-card border border-border bg-bg-sunken sm:h-[520px]">
        {show3D ? (
          <SceneBoundary fallback={<CastleSkeleton label="Summoning the castle…" />}>
            <CastleScene items={items} />
          </SceneBoundary>
        ) : (
          <CastleSilhouette />
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
