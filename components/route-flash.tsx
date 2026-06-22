"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * The full-screen "bright flash" used by the castle transitions.
 *
 * It lives in the root layout (so it persists across route navigation without a
 * flicker). The 3D castle drives its opacity directly by id (`wiz-castle-flash`)
 * while zooming/scrolling; here, after a warp-navigation (flagged in
 * sessionStorage), we fade it back out so the destination page reveals from white.
 */
export function RouteFlash() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let warped = false;
    try {
      warped = sessionStorage.getItem("wiz:warp") === "1";
      if (warped) sessionStorage.removeItem("wiz:warp");
    } catch {
      /* ignore */
    }
    if (!warped) return;
    const el = document.getElementById("wiz-castle-flash");
    if (!el) return;
    // Snap to white (it should already be white from the warp), then fade out.
    el.style.transition = "none";
    el.style.opacity = "1";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.55s ease";
        el.style.opacity = "0";
      });
    });
  }, [pathname]);

  return (
    <div
      id="wiz-castle-flash"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[120] bg-white"
      style={{ opacity: 0 }}
    />
  );
}
