"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CastleBrewing — a simple 2D loading screen shown while the heavy three.js
 * castle chunk downloads and paints (the gap where the hero would otherwise show
 * "Welcome, wizard!" over an empty scene). A round dark-blue brewing-cauldron
 * silhouette with bubbles floating up out of it, and a loading line below.
 *
 * Shown ONLY for plain / first-visit entries — never when arriving via the
 * back-to-castle iris (that transition already covers the load). See castle-hub.
 * `done` fades it out once the scene reports ready.
 */

/** Dark-blue silhouette fill (flat, reads against the near-black --bg). */
const CAULDRON_BLUE = "#2c3872";

/** Bubbles floating up out of the cauldron's mouth (icon coords, 200×200 box). */
const BUBBLES = [
  { x: 74, y: 66, size: 19, delay: "0s", dur: "2.8s" },
  { x: 105, y: 63, size: 22, delay: "0.05s", dur: "3.1s" },
  { x: 126, y: 66, size: 19, delay: "0.5s", dur: "2.9s" },
  { x: 87, y: 64, size: 16, delay: "0.8s", dur: "2.7s" },
  { x: 118, y: 64, size: 17, delay: "1s", dur: "3s" },
  { x: 110, y: 66, size: 15, delay: "1.05s", dur: "2.6s" },
];

/** Icon box size (px). Bubbles are authored in the SVG's 200-unit space and
 *  scaled to the box, so this single knob resizes the whole cauldron. */
const ICON_SIZE = 150;
const SCALE = ICON_SIZE / 200;

export function CastleBrewing({ done }: { done: boolean }) {
  // Loading line: creep toward ~90% while loading (once, never repeating), then
  // fill to 100% ONLY once the scene is ready (done). The creep is kicked off on
  // the next frame so the width transition animates up from 0.
  const [creep, setCreep] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setCreep(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const fillWidth = done ? "100%" : creep ? "90%" : "0%";
  // Slow, decelerating creep while loading (approaches 90% but never reaches it);
  // a quick finish to 100% when ready.
  const fillTransition = done
    ? "width 0.5s ease-out"
    : "width 12s cubic-bezier(0.05, 0.7, 0.1, 1)";

  // Hold the whole loader fully opaque until the fill has reached 100%, THEN fade
  // it out — so the bar visibly completes before the castle appears.
  const [fade, setFade] = React.useState(false);
  React.useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setFade(true), 650); // > fill's 0.5s + a beat
    return () => window.clearTimeout(id);
  }, [done]);

  return (
    <div
      aria-hidden
      className={cn(
        // fixed inset-0 fills the WHOLE viewport — including over the sticky site
        // header (z-40) — so nothing but this loading screen shows while loading.
        // z-50 also clears the castle's drei <Html> labels (zIndexRange max 20)
        // and the Sorting Hat map pin (max 40), which would otherwise punch through.
        "pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[var(--bg)] transition-opacity duration-700 ease-out",
        fade ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="relative" style={{ height: ICON_SIZE, width: ICON_SIZE }}>
        {/* Round cauldron silhouette */}
        <svg viewBox="0 0 200 200" className="relative h-full w-full">
          <g fill={CAULDRON_BLUE}>
            {/* two short legs, spread apart */}
            <path d="M60 166 l-5 18 h11 l3 -13 z" />
            <path d="M140 166 l5 18 h-11 l-3 -13 z" />
            {/* very round belly — horizontal tangent at the base so the bottom is
                a smooth round curve, never a point */}
            <path d="M44 72 C16 100 20 176 100 176 C180 176 184 100 156 72 Z" />
            {/* rim / lip */}
            <ellipse cx="100" cy="68" rx="64" ry="23" />
          </g>
          {/* mouth — cut out to the background so the pot reads as open */}
          <ellipse cx="100" cy="68" rx="46" ry="10" fill="var(--bg)" />
        </svg>

        {/* Bubbles — in front, floating up out of the cauldron's mouth. */}
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="brew-bubble absolute rounded-full bg-[rgba(160,175,220,0.5)]"
            style={{
              left: b.x * SCALE,
              top: b.y * SCALE,
              width: b.size * SCALE,
              height: b.size * SCALE,
              marginLeft: (-b.size * SCALE) / 2,
              marginTop: (-b.size * SCALE) / 2,
              animationDelay: b.delay,
              animationDuration: b.dur,
            }}
          />
        ))}
      </div>

      {/* Loading line — fills toward ~90% while loading, then to 100% only once
          the scene is ready (done). Never repeats. */}
      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-[rgba(154,170,214,0.16)]">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[#9aaad6]"
          style={{ width: fillWidth, transition: fillTransition }}
        />
      </div>
    </div>
  );
}
