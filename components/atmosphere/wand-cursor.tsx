"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useIsTouchDevice,
  usePreference,
  usePrefersReducedMotion,
} from "@/lib/use-preference";

/**
 * WandCursor — Phase 4 STUB.
 *
 * Renders a lightweight glowing follower that eases toward the pointer — a
 * non-destructive preview of the full wand. It is:
 *   - desktop-only      (returns null on touch / coarse-pointer devices),
 *   - reduced-motion aware (returns null when the user prefers reduced motion),
 *   - opt-out-able      (off switch via the `wiz:wand` preference),
 *   - non-interfering   (pointer-events: none over the whole viewport).
 *
 * TODO (Phase 4): replace the single follower with the capped ember/sparkle
 * particle trail + a "cast" flourish on hover of interactive elements, all
 * still rAF-driven and reduced-motion aware.
 */
export function WandCursor() {
  const touch = useIsTouchDevice();
  const reduced = usePrefersReducedMotion();
  const [on, , mounted] = usePreference("wiz:wand", true);
  const dotRef = React.useRef<HTMLDivElement>(null);

  const enabled = mounted && on && !touch && !reduced;

  React.useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    if (!dot) return;

    let raf = 0;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      dot.style.transform = `translate3d(${cx - 8}px, ${cy - 8}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div
        ref={dotRef}
        className="absolute left-0 top-0 size-4 rounded-pill"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, rgba(var(--accent-glow),0.95), rgba(var(--accent-glow),0) 70%)",
          boxShadow: "0 0 14px rgba(var(--accent-glow),0.7)",
        }}
      />
    </div>
  );
}

/**
 * WandToggle — the wand cursor off switch (Phase 4 STUB control).
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
