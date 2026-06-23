"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Cross-page "circular reveal" where the home castle is the OUTER ring and the
 * destination grows/shrinks in a soft-edged hole.
 *
 * The live 3D castle can't be snapshotted by the View Transitions API, so instead
 * we freeze the castle canvas to an image at the moment of transition and show it
 * as a fixed backdrop (`#wiz-castle-freeze`, z-0). The page content (`<main>`,
 * z-10) is then masked with a soft radial gradient: opaque (content) inside the
 * circle, transparent (the frozen castle shows) outside.
 *
 *   Entering a page → the content circle GROWS out of the castle window.
 *   Leaving a page  → the content circle SHRINKS back into it, castle revealed.
 *
 * On the way home the live castle re-mounts under the frozen image and takes over.
 */
const FREEZE_ID = "wiz-castle-freeze";
const MAIN_ID = "main-content";
const FEATHER = 0.34; // soft edge, fraction of the half-diagonal
const GROW_MS = 1000;
const SHRINK_MS = 700;

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

let storedFrame = ""; // last captured castle frame (data URL)

function captureCastle(): boolean {
  const c = document.querySelector("canvas") as HTMLCanvasElement | null;
  if (!c) return false;
  try {
    storedFrame = c.toDataURL("image/jpeg", 0.82);
  } catch {
    return false;
  }
  const f = document.getElementById(FREEZE_ID);
  if (f && storedFrame) f.style.backgroundImage = `url(${storedFrame})`;
  return !!storedFrame;
}

function setFreeze(show: boolean) {
  const f = document.getElementById(FREEZE_ID);
  if (f) f.style.opacity = show && storedFrame ? "1" : "0";
}

/** content openness: 1 = full screen, 0 = closed to a point (castle revealed). */
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
  // The content pages are transparent (they sit on the body background, which is
  // hidden behind the frozen castle). Copy the page background onto <main> so it
  // travels inside the circle — otherwise only the text/cards would reveal.
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

function animate(from: number, to: number, ms: number, done?: () => void) {
  let raf = 0;
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const t = Math.min((ts - start) / ms, 1);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    setContent(from + (to - from) * e);
    if (t < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => {
    if (raf) cancelAnimationFrame(raf);
  };
}

/** Returns enter(href): freeze the castle, then grow the destination out of it. */
export function useEnterReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      if (captureCastle()) setFreeze(true);
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

/** Returns leave(href): shrink this page into the castle, then go (home). */
export function useLeaveReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      setFreeze(true); // re-show the last frozen castle behind the page
      try {
        sessionStorage.setItem("wiz:back", "1");
      } catch {
        /* ignore */
      }
      animate(1, 0, SHRINK_MS, () => router.push(href));
    },
    [router],
  );
}

/** Runs the arrival half of the reveal + renders the frozen-castle backdrop. */
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
      const cancel = animate(0, 1, GROW_MS, () => {
        setContent(1);
        setFreeze(false);
      });
      return cancel;
    }
    if (back) {
      // The shrink already revealed the castle; reset and let the live one take over.
      setContent(1);
      const to = window.setTimeout(() => setFreeze(false), 500);
      return () => window.clearTimeout(to);
    }
  }, [pathname]);

  return (
    <div
      id={FREEZE_ID}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  );
}
