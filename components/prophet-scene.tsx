"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";

import { Newspaper, AURA_STORY, CROWDFLOW_STORY } from "./newspaper";

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Overall size of the newspapers. Bigger value = bigger papers.
 * 0.18 ≈ 480px wide, 0.23 ≈ 610px, 0.28 ≈ 745px (desktop). This is THE knob to
 * turn to resize them; the fan-out spread below scales with it automatically.
 */
const HTML_SCALE = 0.25;

/**
 * Phones (viewport < 640px) get smaller papers so the fan-out stays inside the
 * page's side margins as it spreads. The spread scales with this automatically.
 * Lower = smaller phone papers; desktop always uses HTML_SCALE. Keyed to the
 * VIEWPORT width (matches the section's `sm:` spacing), never the canvas width.
 */
const HTML_SCALE_MOBILE = 0.19;
const MOBILE_VW = 640;
/** Fixed phone camera distance so the paper size + fan stay constant while the
 *  sticky height is tuned for tighter gaps (desktop stays aspect-driven).
 *  Higher = papers a touch smaller / more side margin. */
const MOBILE_CAM_Z = 8.6;
const scaleForVw = (w: number) => (w < MOBILE_VW ? HTML_SCALE_MOBILE : HTML_SCALE);

/**
 * Raise the papers toward the heading (world units up). Higher = smaller gap
 * between the "Projects" title and the papers. ~0.22 ≈ 55px up on desktop and is
 * about the max with the current poses — beyond it the back paper's top clips
 * once it fans out (to go tighter, also lower the back paper's spread `y`).
 */
const LIFT = 0.22;

/**
 * Phones only: raise the papers higher (world units up) so they sit closer to the
 * 'Projects' heading. Larger = closer to the heading; too large starts to clip the
 * paper tops. Desktop keeps LIFT (viewport-keyed, so desktop never changes).
 */
const LIFT_MOBILE = 0.8;

/**
 * Two newspapers that fan apart as `progressRef` goes 0 → 1.
 *
 * pose(0): the front paper (Aura) sits near-centred with a slight right tilt; the
 * back paper (CrowdFlow) hides behind it with only its top-left corner peeking.
 * pose(1): both have tilted a little more and slid apart — readable, but still
 * overlapping in the middle (never fully separated). Scrolling back reverses it.
 */
function Papers({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const front = React.useRef<Group>(null);
  const back = React.useRef<Group>(null);
  // Mobile is decided by the VIEWPORT width (matches the section's sm: spacing),
  // not the canvas width — the canvas sits in a narrower column than the window.
  const [vw, setVw] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  React.useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const scale = scaleForVw(vw);

  useFrame((state) => {
    const t = smooth(clamp01(progressRef.current));
    const aspect = state.viewport.aspect;

    // Phones: fix the framing (spread + camera) so shrinking the sticky for
    // tighter gaps doesn't change the paper size or fan. Desktop stays aspect-driven.
    const isMobile = window.innerWidth < MOBILE_VW;
    const lift = isMobile ? LIFT_MOBILE : LIFT;
    const spread = isMobile ? 0.5 : Math.min(1, Math.max(0.5, aspect / 1.6));
    const targetZ = isMobile
      ? MOBILE_CAM_Z
      : aspect >= 1
        ? 6
        : lerp(6, 9.6, clamp01((1 - aspect) / 0.6));
    if (Math.abs(state.camera.position.z - targetZ) > 0.001) {
      state.camera.position.z = targetZ;
    }
    // Fan the papers wider as they grow, so bigger HTML_SCALE keeps the same
    // relative overlap (0.18 is the tuning baseline). Only the horizontal
    // separation scales — the tilt and peek stay put.
    const fan = spread * (scaleForVw(window.innerWidth) / 0.18);

    if (front.current) {
      // x offsets are symmetric with the back paper (±same values) so the pair's
      // midpoint stays exactly at canvas centre at every zoom — see back paper below.
      front.current.position.set(lerp(0.09, 0.715, t) * fan, lerp(0.0, -0.12, t) + lift, 0.06);
      front.current.rotation.set(
        lerp(0.04, 0.08, t),
        lerp(-0.015, -0.04, t),
        lerp(-0.04, -0.1, t),
      );
    }
    if (back.current) {
      back.current.position.set(lerp(-0.09, -0.715, t) * fan, lerp(0.13, 0.22, t) + lift, -0.06);
      back.current.rotation.set(
        lerp(0.04, 0.08, t),
        lerp(0.015, 0.04, t),
        lerp(0.05, 0.1, t),
      );
    }
  });

  return (
    <>
      {/* Back paper (CrowdFlow) — lower z so the front paper overlaps it. */}
      <group ref={back}>
        <Html
          transform
          scale={scale}
          zIndexRange={[16, 6]}
          occlude={false}
          style={{ pointerEvents: "none" }}
        >
          <Newspaper story={CROWDFLOW_STORY} />
        </Html>
      </group>

      {/* Front paper (Aura). */}
      <group ref={front}>
        <Html
          transform
          scale={scale}
          zIndexRange={[40, 26]}
          occlude={false}
          style={{ pointerEvents: "none" }}
        >
          <Newspaper story={AURA_STORY} />
        </Html>
      </group>
    </>
  );
}

/** Hands the parent an `invalidate()` so scrolling can request on-demand frames. */
function ReadySignal({ onReady }: { onReady?: (invalidate: () => void) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  React.useEffect(() => {
    onReady?.(invalidate);
    invalidate();
  }, [invalidate, onReady]);
  return null;
}

export function ProphetScene({
  progressRef,
  onReady,
}: {
  progressRef: React.MutableRefObject<number>;
  onReady?: (invalidate: () => void) => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      // !overflow-visible defeats R3F's inline `overflow: hidden` so the papers
      // can fan out past the canvas/container edges without being clipped.
      className="!absolute inset-0 !overflow-visible"
    >
      <ReadySignal onReady={onReady} />
      <Papers progressRef={progressRef} />
    </Canvas>
  );
}
