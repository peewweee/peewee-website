"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { Newspaper, AURA_STORY, CROWDFLOW_STORY } from "./newspaper";

// Heavy three.js bundle — client-only, loaded on demand.
const ProphetScene = dynamic(
  () => import("./prophet-scene").then((m) => m.ProphetScene),
  { ssr: false, loading: () => null },
);

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/**
 * When the spread plays, as fractions of a viewport height measured from the
 * section's top edge:
 *   SPREAD_START — spread begins (papers still stacked, entering from below)
 *   SPREAD_END   — spread finishes (papers ~centered — "the middle of the paper")
 * So the fan-out happens as the papers scroll up into view and is complete by the
 * time they're centered. Widen the gap for a slower spread, narrow it for snappier.
 */
const SPREAD_START = 0.7;
const SPREAD_END = 0.0;

/**
 * FeaturedProject "Daily Prophet" — two 3D newspapers that fan apart as you
 * scroll a pinned section, then re-fold when you scroll back up.
 *
 * Reduced-motion or no-WebGL users get a static, both-papers-readable layout.
 * Screen-reader users get real links (the papers are decorative).
 */
export function FeaturedProphet() {
  const reduceMotion = useReducedMotion();
  const [webgl, setWebgl] = React.useState<boolean | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const progressRef = React.useRef(0);
  const invalidateRef = React.useRef<() => void>(() => {});

  // Detect WebGL once on the client (null = "not decided yet" → render static).
  React.useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = !!(
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      );
      setWebgl(ok);
    } catch {
      setWebgl(false);
    }
  }, []);

  const animate = webgl === true && !reduceMotion;

  // Map page scroll through the tall wrapper → progress 0..1 for the scene.
  React.useEffect(() => {
    if (!animate) return;
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Drive the spread off how far the section has risen into view, so it plays
      // as the papers scroll up and finishes when they're ~centered.
      const startTop = SPREAD_START * vh;
      const endTop = SPREAD_END * vh;
      progressRef.current = clamp01((startTop - rect.top) / (startTop - endTop));
      invalidateRef.current();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [animate]);

  // Static fallback (also the pre-hydration / SSR render, until webgl resolves).
  if (!animate) {
    return (
      <div className="mt-2 sm:mt-6">
        <div className="flex flex-wrap items-start justify-center gap-6">
          <Newspaper story={AURA_STORY} className="-rotate-2" />
          <Newspaper story={CROWDFLOW_STORY} className="rotate-2" />
        </div>
        <ViewMore />
        <ScreenReaderLinks />
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-1">
      {/* Wrapper height = spread-on-entry + a short pinned hold before release.
          Phones: a shorter sticky = less empty space above/below the papers. */}
      <div ref={scrollRef} className="relative h-[52vh] sm:h-[130vh]">
        <div className="sticky top-0 flex h-[70svh] items-center overflow-visible sm:h-[100svh]">
          <div className="absolute inset-0">
            <ProphetScene
              progressRef={progressRef}
              onReady={(fn) => {
                invalidateRef.current = fn;
                fn();
              }}
            />
          </div>

        </div>
      </div>
      <ViewMore />
      <ScreenReaderLinks />
    </div>
  );
}

function ViewMore() {
  return (
    <div className="mt-2 flex justify-center">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:text-gold-hover"
      >
        View more projects
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** The papers are decorative canvas content — expose the links to AT. */
function ScreenReaderLinks() {
  return (
    <ul className="sr-only">
      <li>
        <Link href={AURA_STORY.href}>Aura — {AURA_STORY.headline}</Link>
      </li>
      <li>
        <Link href={CROWDFLOW_STORY.href}>
          CrowdFlow — {CROWDFLOW_STORY.headline}
        </Link>
      </li>
    </ul>
  );
}
