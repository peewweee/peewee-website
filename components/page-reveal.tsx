"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Cross-page "into the window" reveal.
 *
 * The camera flies INSIDE a tower (its interior is filled with the window's
 * glowing yellow), so the whole screen goes yellow. We then navigate over a
 * solid-yellow backdrop (#wiz-reveal-bg, z-0) and the destination page grows out
 * of the centre — its `<main>` (z-10) masked by a radial gradient with the
 * softest possible edge. Leaving reverses it: the page shrinks into the yellow,
 * then the live castle re-mounts (zoomed inside the window) and pulls out.
 */
const BG_ID = "wiz-reveal-bg";
const MAIN_ID = "main-content";
const FEATHER = 1; // maximum softness — the rim is a full radial gradient
const GROW_MS = 1000;
const SHRINK_MS = 700;

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function setBg(show: boolean) {
  const b = document.getElementById(BG_ID);
  if (b) b.style.opacity = show ? "1" : "0";
}

/** content openness: 1 = full screen, 0 = closed to a point (yellow revealed). */
function setContent(v: number) {
  const m = document.getElementById(MAIN_ID);
  if (!m) return;
  v = v < 0 ? 0 : v > 1 ? 1 : v;
  if (v >= 0.999) {
    m.style.webkitMaskImage = "";
    m.style.maskImage = "";
    m.style.backgroundColor = "";
    m.style.backgroundImage = "";
    m.style.backgroundAttachment = "";
    return;
  }
  // Content pages are transparent (they sit on the body background, which is
  // hidden behind the yellow). Copy that background onto <main> so the whole page
  // — not just the text — travels inside the circle.
  if (!m.style.backgroundColor) {
    const bs = getComputedStyle(document.body);
    m.style.backgroundColor = bs.backgroundColor;
    m.style.backgroundImage = bs.backgroundImage;
    m.style.backgroundAttachment = "fixed";
  }
  const maxR = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 2;
  const f = maxR * FEATHER;
  const r = -f + v * (maxR + f); // v=1 → maxR (open); v=0 → -f (closed)
  const inner = Math.max(0, r);
  const outer = r + f;
  const cy = window.scrollY + window.innerHeight / 2; // viewport centre
  const mask = `radial-gradient(circle at 50% ${cy}px, #000 ${inner}px, transparent ${outer}px)`;
  m.style.webkitMaskImage = mask;
  m.style.maskImage = mask;
}

function animate(ms: number, onProgress: (e: number) => void, done?: () => void) {
  let raf = 0;
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const t = Math.min((ts - start) / ms, 1);
    onProgress(1 - Math.pow(1 - t, 3)); // easeOutCubic
    if (t < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => {
    if (raf) cancelAnimationFrame(raf);
  };
}

/** Returns enter(href): the page grows out of the yellow window. */
export function useEnterReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      setBg(true);
      try {
        sessionStorage.setItem("wiz:enter", "1");
      } catch {
        /* ignore */
      }
      router.push(href);
    },
    [router],
  );
}

/** Returns leave(href): the page shrinks into the yellow window, then go (home). */
export function useLeaveReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      setBg(true);
      try {
        sessionStorage.setItem("wiz:back", "1");
      } catch {
        /* ignore */
      }
      animate(
        SHRINK_MS,
        (e) => setContent(1 - e),
        () => router.push(href),
      );
    },
    [router],
  );
}

/** Runs the arrival half of the reveal + renders the yellow backdrop. */
export function RevealController() {
  const pathname = usePathname();
  useIso(() => {
    let enter = false;
    let back = false;
    try {
      enter = sessionStorage.getItem("wiz:enter") === "1";
      if (enter) sessionStorage.removeItem("wiz:enter");
      back = sessionStorage.getItem("wiz:back") === "1";
      if (back) sessionStorage.removeItem("wiz:back");
    } catch {
      /* ignore */
    }
    if (enter) {
      setContent(0); // hide the destination before first paint
      return animate(
        GROW_MS,
        (e) => setContent(e),
        () => {
          setContent(1);
          setBg(false);
        },
      );
    }
    if (back) {
      // The shrink already revealed the yellow; reset and let the live castle
      // (which mounts zoomed inside the window) take over.
      setContent(1);
      const to = window.setTimeout(() => setBg(false), 500);
      return () => window.clearTimeout(to);
    }
  }, [pathname]);

  return (
    <div
      id={BG_ID}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: 0,
        background:
          "radial-gradient(circle at 50% 50%, #fff3cc 0%, #ffd873 45%, #f3bd3c 100%)",
      }}
    />
  );
}
