"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion, useIsTouchDevice } from "@/lib/use-preference";

/**
 * Shared internals for the gilded picture frames — the "living portrait" photo
 * and the gilding (gradients + carve/lift/patina filters).
 *
 * Used by both portrait-frame.tsx (the crested hero frame) and photo-frame.tsx
 * (the thinner gallery frames), so the animation behaviour and the gold finish
 * are defined exactly once.
 */

/** How far (px) the photo leans toward the cursor at the frame's edge. */
const PARALLAX_PX = 7;
/** Overscan so sway/parallax can never reveal the image's edge. */
export const OVERSCAN = "scale(1.06)";

/**
 * Leans `targetRef` a few pixels toward the pointer while it is over `frameRef`.
 * Writes the transform straight to the node (no re-render) and coalesces moves
 * into one rAF per frame. Never binds under reduced motion or on touch, so those
 * visitors get a completely still photo.
 */
export function useFrameParallax(
  frameRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<HTMLElement | null>,
) {
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouchDevice();
  const interactive = !reduced && !touch;
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    if (!interactive) return;
    const frame = frameRef.current;
    const target = targetRef.current;
    if (!frame || !target) return;

    let px = 0;
    let py = 0;
    const apply = () => {
      rafRef.current = 0;
      target.style.transform = `translate3d(${px}px, ${py}px, 0) ${OVERSCAN}`;
    };
    const schedule = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      // -1…1 from the frame's centre, then damped to a few pixels.
      px = ((e.clientX - r.left) / r.width - 0.5) * 2 * PARALLAX_PX;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2 * PARALLAX_PX;
      schedule();
    };
    const onLeave = () => {
      px = 0;
      py = 0;
      schedule();
    };

    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerleave", onLeave);
    return () => {
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      target.style.transform = OVERSCAN;
    };
  }, [interactive, frameRef, targetRef]);
}

/**
 * The photo behind the frame's glass — quietly alive: a slow breathing zoom, a
 * very slight drift/sway, an occasional sheen, and pointer parallax.
 *
 * The motion layers are nested (parallax → sway → breathe) so the effects
 * compose instead of fighting over one `transform`.
 *
 * `className` / `style` position and clip the window (the caller places it over
 * the frame's opening; an oval frame just adds a 50% border-radius).
 */
export function LivingPhoto({
  frameRef,
  src,
  alt,
  sizes,
  priority = false,
  className,
  style,
}: {
  frameRef: React.RefObject<HTMLElement | null>;
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  useFrameParallax(frameRef, parallaxRef);

  return (
    <div className={cn("absolute overflow-hidden bg-surface", className)} style={style}>
      <div
        ref={parallaxRef}
        className="h-full w-full will-change-transform"
        style={{ transform: OVERSCAN }}
      >
        <div className="portrait-sway h-full w-full motion-reduce:animate-none">
          <div className="portrait-breathe relative h-full w-full motion-reduce:animate-none">
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Behind-glass reflection — a soft diagonal highlight. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(122deg,rgba(244,236,216,0.16)_0%,rgba(244,236,216,0.05)_26%,transparent_46%)]"
      />
      {/* Warm vignette so the photo sits down into the frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_36px_rgba(11,16,38,0.75)]"
      />
      {/* Occasional slow sheen sweeping across the glass. */}
      <div
        aria-hidden
        className="portrait-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(244,236,216,0.42),transparent)] motion-reduce:hidden"
      />
    </div>
  );
}

/**
 * The gilding: gold gradients + the carve / lift / patina filters. Render this
 * INSIDE the frame's own `<defs>`.
 *
 * Gradients use `userSpaceOnUse` scaled to the frame's viewBox so one light
 * direction (top-left) holds across every piece of a frame, whatever its size.
 */
export function GildingDefs({
  id,
  w,
  h,
}: {
  id: (name: string) => string;
  w: number;
  h: number;
}) {
  return (
    <>
      <linearGradient
        id={id("rail")}
        gradientUnits="userSpaceOnUse"
        x1={0.12 * w}
        y1={0.08 * h}
        x2={0.88 * w}
        y2={0.933 * h}
      >
        <stop offset="0" stopColor="#f9edc9" />
        <stop offset="0.2" stopColor="#efd694" />
        <stop offset="0.5" stopColor="#cfa75e" />
        <stop offset="0.75" stopColor="#b98f43" />
        <stop offset="1" stopColor="#835f2b" />
      </linearGradient>

      {/* The cove is a hollow, so its shading runs the other way — dark where the
          rail is bright. That inversion is what sells the step. */}
      <linearGradient
        id={id("cove")}
        gradientUnits="userSpaceOnUse"
        x1={0.12 * w}
        y1={0.933 * h}
        x2={0.88 * w}
        y2={0.08 * h}
      >
        <stop offset="0" stopColor="#8a6832" />
        <stop offset="0.35" stopColor="#6d4d1f" />
        <stop offset="0.7" stopColor="#93702f" />
        <stop offset="1" stopColor="#c2a05c" />
      </linearGradient>

      <linearGradient
        id={id("lip")}
        gradientUnits="userSpaceOnUse"
        x1={0.14 * w}
        y1={0.2 * h}
        x2={0.86 * w}
        y2={0.867 * h}
      >
        <stop offset="0" stopColor="#efd694" />
        <stop offset="0.55" stopColor="#c39a4e" />
        <stop offset="1" stopColor="#7c5a25" />
      </linearGradient>

      <linearGradient
        id={id("orn")}
        gradientUnits="userSpaceOnUse"
        x1={0.18 * w}
        y1={0.027 * h}
        x2={0.88 * w}
        y2={0.973 * h}
      >
        <stop offset="0" stopColor="#f9edc9" />
        <stop offset="0.22" stopColor="#efd694" />
        <stop offset="0.55" stopColor="#c69c50" />
        <stop offset="0.82" stopColor="#9a7434" />
        <stop offset="1" stopColor="#7c5a25" />
      </linearGradient>

      {/* Aged bloom in the deepest hollows. */}
      <radialGradient id={id("patinaTint")} cx="0.5" cy="0.42" r="0.75">
        <stop offset="0.55" stopColor="#7c5a25" stopOpacity="0" />
        <stop offset="1" stopColor="#4a341280" />
      </radialGradient>

      {/* --- carved depth: recessed inner shadow + a raised top-left glint --- */}
      <filter id={id("carve")} x="-12%" y="-12%" width="124%" height="124%">
        <feOffset in="SourceAlpha" dx="0" dy="5" result="dn" />
        <feGaussianBlur in="dn" stdDeviation="5" result="dnb" />
        <feComposite in="SourceAlpha" in2="dnb" operator="out" result="innerMask" />
        <feFlood floodColor="#3b2a0f" floodOpacity="0.8" result="dark" />
        <feComposite in="dark" in2="innerMask" operator="in" result="innerShadow" />

        <feOffset in="SourceAlpha" dx="-2" dy="-3" result="up" />
        <feGaussianBlur in="up" stdDeviation="2.5" result="upb" />
        <feComposite in="SourceAlpha" in2="upb" operator="out" result="hiMask" />
        <feFlood floodColor="#fff6dd" floodOpacity="0.65" result="light" />
        <feComposite in="light" in2="hiMask" operator="in" result="highlight" />

        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="innerShadow" />
          <feMergeNode in="highlight" />
        </feMerge>
      </filter>

      {/* --- lifts the whole carving off the wall --- */}
      <filter id={id("lift")} x="-20%" y="-14%" width="140%" height="130%">
        <feDropShadow
          dx="0"
          dy="16"
          stdDeviation="20"
          floodColor="#04060f"
          floodOpacity="0.6"
        />
      </filter>

      {/* --- speckled age, painted only inside the gilt --- */}
      <filter id={id("patina")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          seed="11"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 0.30
                  0 0 0 0 0.22
                  0 0 0 0 0.08
                  0 0 0 0.75 0"
          result="tint"
        />
        <feComposite in="tint" in2="SourceAlpha" operator="in" />
      </filter>
    </>
  );
}

/** Namespaced id helpers, so several frames on one page never collide. */
export function useFrameIds() {
  // useId contains ':' which is invalid inside url(#…), so strip it.
  const uid = React.useId().replace(/:/g, "");
  return React.useMemo(() => {
    const id = (name: string) => `${uid}-${name}`;
    return { id, url: (name: string) => `url(#${id(name)})` };
  }, [uid]);
}

/** Rounded-rect path. Two of these with fill-rule="evenodd" make a band. */
export function rrect(x: number, y: number, w: number, h: number, r: number) {
  return (
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} ` +
    `V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} ` +
    `H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} ` +
    `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  );
}

/** Ellipse as a path, so it can be combined into an evenodd annulus. */
export function epath(cx: number, cy: number, rx: number, ry: number) {
  return (
    `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} ` +
    `A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`
  );
}
