"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * The "enter through the window" transition (replaces the ripple warp).
 *
 * We fly the camera into a tower's lit window; at the peak a dark "window
 * interior" covers the screen and we navigate. The destination then GROWS out of
 * that point — scaling up from the center — so the next page looks like it was
 * inside the window all along. Returning home reverses it: the page shrinks back
 * into the window, then the castle reveals zoomed-in on the tower (the scene
 * holds there before pulling out).
 *
 * The animated element is the persistent layout content (`#wiz-portal-target`),
 * which survives route changes, so the grow/shrink carries across the page swap.
 * Drive it from anywhere with `setPortal(scale, dim)`.
 */
const TARGET_ID = "wiz-portal-target";
const DIM_ID = "wiz-portal-dim";
const MIN_SCALE = 0.12; // how small the page is when "inside the window"
const GROW_MS = 780;
const HOME_REVEAL_MS = 340;

declare global {
  interface Window {
    __wizPortal?: { set: (scale: number, dim: number) => void };
  }
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** scale: 1 = full screen, →0 = shrunk into the window. dim: 0 = clear, 1 = dark. */
export function setPortal(scale: number, dim: number) {
  if (typeof window !== "undefined") window.__wizPortal?.set(scale, dim);
}

export function PortalTransition() {
  const pathname = usePathname();

  // Install the controller against the persistent layout DOM (runs once).
  React.useEffect(() => {
    const target = document.getElementById(TARGET_ID);
    const dimEl = document.getElementById(DIM_ID);
    if (!target || !dimEl) return;
    let scaled = false;
    const set = (scale: number, dim: number) => {
      scale = scale < 0 ? 0 : scale > 1 ? 1 : scale;
      dim = dim < 0 ? 0 : dim > 1 ? 1 : dim;
      if (scale >= 0.999) {
        if (scaled) {
          target.style.transform = "";
          target.style.transformOrigin = "";
          target.style.willChange = "";
          scaled = false;
        }
      } else {
        if (!scaled) {
          // Scale around the VIEWPORT center (the page element is taller than the
          // screen), so the page grows from / shrinks into the middle of view.
          const originY = window.scrollY + window.innerHeight / 2;
          target.style.transformOrigin = `50% ${originY}px`;
          target.style.willChange = "transform";
          scaled = true;
        }
        target.style.transform = `scale(${scale})`;
      }
      dimEl.style.opacity = String(dim);
    };
    window.__wizPortal = { set };
    return () => {
      if (window.__wizPortal?.set === set) delete window.__wizPortal;
      set(1, 0);
    };
  }, []);

  // On arrival after a portal navigation (flagged in sessionStorage):
  //  - content page (forward): grow out of the window (scale up, dim out)
  //  - home (back): just lift the dark — the scene holds on the tower, then pulls out
  // A layout effect sets the start state before the first paint, so nothing flashes.
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
    const isHome = pathname === "/";
    const DUR = isHome ? HOME_REVEAL_MS : GROW_MS;
    set(isHome ? 1 : MIN_SCALE, 1);
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / DUR, 1);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      if (isHome) {
        set(1, 1 - e);
      } else {
        set(MIN_SCALE + (1 - MIN_SCALE) * e, 1 - Math.min(t / 0.55, 1));
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <div
      id={DIM_ID}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[120]"
      style={{
        opacity: 0,
        background: "radial-gradient(circle at center, #0a0e22 0%, #04050d 100%)",
      }}
    />
  );
}
