"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useIsTouchDevice,
  usePreference,
  usePrefersReducedMotion,
} from "@/lib/use-preference";

// Capped sparkle trail — a small pool of sparks recycled as the wand moves.
const TRAIL = 12;
const SPAWN_DIST = 15; // px of travel between spawned sparks
const INTERACTIVE =
  "a,button,[role='button'],input,textarea,select,label,summary,[tabindex]";

/**
 * WandCursor — the pointer becomes the Wizarding design-system wand: a wooden
 * wand with a glowing four-point star tip that eases-tracks the pointer, a capped
 * sparkle trail (`trailDrift`), a gentle `burst` idle that swells to `castBurst`
 * over interactive targets, and the extra floating sparkles the design system
 * shows on cast. While active it hides the OS cursor site-wide.
 *
 * Stays: desktop-only (null on touch), reduced-motion aware (null), and
 * opt-out-able (the `wiz:wand` preference / WandToggle). rAF-driven and
 * pointer-events: none, so it never re-renders per frame or blocks clicks.
 */
export function WandCursor() {
  const touch = useIsTouchDevice();
  const reduced = usePrefersReducedMotion();
  const [on, , mounted] = usePreference("wiz:wand", true);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const slotRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const sparkRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

  const enabled = mounted && on && !touch && !reduced;

  React.useEffect(() => {
    if (!enabled) return;
    const tip = tipRef.current;
    const wrap = wrapRef.current;
    if (!tip || !wrap) return;

    // Hide the OS cursor everywhere while the wand is on.
    document.documentElement.classList.add("wand-active");

    let raf = 0;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let visible = false;
    let lastX = mx;
    let lastY = my;
    let idx = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        wrap.style.opacity = "1";
      }
      const casting = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
      tip.classList.toggle("wand-cast", casting);

      // Spawn a drifting sparkle every SPAWN_DIST px of travel.
      const dx = mx - lastX;
      const dy = my - lastY;
      if (dx * dx + dy * dy > SPAWN_DIST * SPAWN_DIST) {
        lastX = mx;
        lastY = my;
        const slot = slotRefs.current[idx];
        const spark = sparkRefs.current[idx];
        if (slot && spark) {
          slot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
          spark.style.animation = "none";
          void spark.offsetWidth; // reflow so the animation restarts
          spark.style.animation = "";
        }
        idx = (idx + 1) % TRAIL;
      }
    };
    const hide = () => {
      visible = false;
      wrap.style.opacity = "0";
    };

    const tick = () => {
      // Ease the wand toward the pointer for a floaty, magical follow.
      cx += (mx - cx) * 0.28;
      cy += (my - cy) * 0.28;
      tip.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      document.documentElement.classList.remove("wand-active");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: 0, transition: "opacity 220ms ease" }}
    >
      {/* Capped sparkle trail (recycled sparks that drift + fade from the tip). */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            slotRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 block"
        >
          <span
            ref={(el) => {
              sparkRefs.current[i] = el;
            }}
            className="wand-spark absolute block rounded-full"
            style={{
              width: "7px",
              height: "7px",
              margin: "-3.5px 0 0 -3.5px",
              background:
                "radial-gradient(circle, rgba(var(--accent-glow),0.95), rgba(var(--accent-glow),0) 70%)",
            }}
          />
        </span>
      ))}

      {/* The wand — tip (glowing star) at the pointer; the wooden shaft trails
          down-left. Paths ported verbatim from the Wizarding design system. */}
      <div ref={tipRef} className="wand-tip absolute left-0 top-0 will-change-transform">
        <svg
          width="46"
          height="46"
          viewBox="0 0 48 48"
          fill="none"
          className="absolute overflow-visible"
          style={{ left: "-30px", top: "-13px" }}
        >
          {/* handle knob + wooden shaft */}
          <circle cx="12" cy="38" r="3.4" fill="#4a3729" />
          <path d="M12 38 L29 17" stroke="#5a4632" strokeWidth="5" strokeLinecap="round" />
          <path d="M12.6 36.8 L28 17.6" stroke="#7d6440" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <path d="M15.5 35 l3.2 -4" stroke="#caa84a" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="16" r="2.2" fill="#7d6440" />
          {/* glowing four-point star tip (burst → castBurst) */}
          <g className="wand-tipgroup">
            <circle cx="31.5" cy="14" r="7.5" fill="rgba(212,175,55,0.36)" />
            <path
              d="M31.5 7 L33 12.5 L38.5 14 L33 15.5 L31.5 21 L30 15.5 L24.5 14 L30 12.5 Z"
              fill="#f6e3a0"
            />
            <path
              d="M26.5 9 L29.4 11.9M36.5 9 L33.6 11.9M26.5 19 L29.4 16.1M36.5 19 L33.6 16.1"
              stroke="#f6e3a0"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
          {/* floating cast sparkles */}
          <g className="wand-floaters">
            <circle cx="39" cy="8" r="1.5" fill="#f6e3a0" style={{ animation: "sparkle 1.1s ease-in-out infinite" }} />
            <circle cx="41" cy="16" r="1.1" fill="#f0d98a" style={{ animation: "sparkle 1.1s ease-in-out 0.35s infinite" }} />
            <circle cx="36" cy="5" r="1" fill="#fff" style={{ animation: "sparkle 1.1s ease-in-out 0.7s infinite" }} />
            <circle cx="42" cy="11" r="0.8" fill="#fff" style={{ animation: "sparkle 1.1s ease-in-out 1s infinite" }} />
          </g>
        </svg>
      </div>
    </div>
  );
}

/**
 * WandToggle — the wand cursor off switch (restores the OS cursor).
 * Hidden on touch devices (where there is no pointer to enhance).
 */
export function WandToggle({ className }: { className?: string }) {
  const touch = useIsTouchDevice();
  const [on, setOn, mounted] = usePreference("wiz:wand", true);

  if (mounted && touch) return null;
  const pressed = mounted ? on : true;

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? "Turn wand cursor off" : "Turn wand cursor on"}
      title={pressed ? "Wand cursor: on" : "Wand cursor: off"}
      onClick={() => setOn(!on)}
      className={cn(
        "grid size-11 place-items-center rounded-pill border border-border-strong bg-surface text-foreground-muted transition-all hover:text-accent-text hover:shadow-glow focus-visible:shadow-focus focus-visible:outline-none",
        pressed && "border-accent text-accent-text shadow-glow",
        className,
      )}
    >
      <Wand2 className="size-5" />
    </button>
  );
}
