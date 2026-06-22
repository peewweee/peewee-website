"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * The "enter through the window" transition.
 *
 * We slowly fly the camera into a tower's lit window; as we arrive the screen
 * blooms to bright warm yellow (the window's glow filling the view), we navigate,
 * and on the far side the yellow fades back out to reveal the page. Returning home
 * reverses the fade, then the castle reveals zoomed-in on the tower.
 *
 * The yellow overlay lives in the root layout, so it persists across the route
 * swap. Drive the fade from anywhere with `setPortal(0..1)` (1 = full yellow).
 */
const FADE_ID = "wiz-portal-fade";
const FADE_OUT_MS = 520;

declare global {
  interface Window {
    __wizPortal?: { set: (v: number) => void };
  }
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Set the yellow fade (0 = clear, 1 = full bright yellow). No-op until mounted. */
export function setPortal(v: number) {
  if (typeof window !== "undefined") window.__wizPortal?.set(v);
}

export function PortalTransition() {
  const pathname = usePathname();

  React.useEffect(() => {
    const el = document.getElementById(FADE_ID);
    if (!el) return;
    const set = (v: number) => {
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      el.style.transition = "none";
      el.style.opacity = String(v);
    };
    window.__wizPortal = { set };
    return () => {
      if (window.__wizPortal?.set === set) delete window.__wizPortal;
      set(0);
    };
  }, []);

  // On arrival after a portal navigation (flagged in sessionStorage): start at
  // full yellow and fade out to reveal the page (or, on home, the zoomed-in
  // tower the scene then holds on and pulls out from). A layout effect sets the
  // yellow before the first paint, so the destination never flashes in clear.
  useIso(() => {
    let warped = false;
    try {
      warped = sessionStorage.getItem("wiz:warp") === "1";
      if (warped) sessionStorage.removeItem("wiz:warp");
    } catch {
      /* ignore */
    }
    if (!warped) return;
    const set = window.__wizPortal?.set;
    if (!set) return;
    set(1);
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / FADE_OUT_MS, 1);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      set(1 - e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <div
      id={FADE_ID}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[120]"
      style={{
        opacity: 0,
        background:
          "radial-gradient(circle at center, #ffeaa3 0%, #ffd24a 60%, #f4bf38 100%)",
      }}
    />
  );
}
