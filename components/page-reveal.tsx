"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Castle navigation hooks + a bridge to PortalTransition's imperative close.
 *
 * Entering a window flags "wiz:reveal"="in" and navigates; PortalTransition OPENS
 * the iris on arrival (warm field → page). Leaving plays the iris CLOSE on the
 * page being left first (the hole shrinks shut, yellow fills in), then flags "in"
 * and navigates — so the arrival opens onto the castle. A reversed, symmetric
 * transition that stays full-yellow across the route swap.
 */

// PortalTransition registers its imperative close animation here so the leave
// hook can play it on the current page before navigating.
let closeReveal: ((onDone: () => void) => void) | null = null;
export function registerCloseReveal(fn: ((onDone: () => void) => void) | null) {
  closeReveal = fn;
}

// The mounted castle scene registers a "fly into this route's tower" action so
// the header nav can trigger the same 3D dive as clicking the tower directly.
// Only present on the home/castle page — elsewhere the nav falls back to a plain
// reveal (there's no castle to dive through).
let flyToTower: ((href: string) => boolean) | null = null;
export function registerFlyToTower(fn: ((href: string) => boolean) | null) {
  flyToTower = fn;
}
/** Ask the castle to dive into the tower for `href`. Returns true if it handled
 *  it (castle mounted + tower found), false to fall back to a plain reveal. */
export function requestFlyToTower(href: string): boolean {
  return flyToTower ? flyToTower(href) : false;
}

export function useEnterReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      try {
        sessionStorage.setItem("wiz:reveal", "in");
      } catch {
        /* ignore */
      }
      router.push(href);
    },
    [router],
  );
}

export function useLeaveReveal() {
  const router = useRouter();
  return React.useCallback(
    (href: string) => {
      let navigated = false;
      const go = () => {
        if (navigated) return; // idempotent — close callback + guard can't double-fire
        navigated = true;
        try {
          sessionStorage.setItem("wiz:reveal", "in");
        } catch {
          /* ignore */
        }
        router.push(href);
      };
      // Close the iris on the current page first, then navigate; fall back to a
      // plain open-on-arrival if the overlay isn't mounted.
      if (closeReveal) {
        closeReveal(go);
        // Safety net: never let a missed close callback strand the page.
        window.setTimeout(go, 2000);
      } else {
        go();
      }
    },
    [router],
  );
}
