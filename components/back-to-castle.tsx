"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useLeaveReveal } from "@/components/page-reveal";

/**
 * On any content page, scrolling UP while already at the top returns to the home
 * castle: the page shrinks into a closing circular hole, revealing the castle
 * underneath — which then opens zoomed in on this page's tower and pulls out to
 * the wide view (see the scene's intro warp).
 */
export function BackToCastle() {
  const pathname = usePathname();
  const leave = useLeaveReveal();

  React.useEffect(() => {
    if (pathname === "/") return;
    let fired = false;
    let armed = false;
    let acc = 0;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 400);

    const trigger = () => {
      if (fired) return;
      fired = true;
      // Remember which page we left so the castle opens zoomed-in on its tower.
      try {
        sessionStorage.setItem("wiz:from", pathname);
      } catch {
        /* ignore */
      }
      // Shrink this page into a closing circle, revealing the castle underneath.
      leave("/");
    };

    const onWheel = (e: WheelEvent) => {
      if (!armed || window.scrollY > 2) {
        acc = 0;
        return;
      }
      if (e.deltaY < 0) {
        acc += -e.deltaY;
        if (acc > 150) trigger();
      } else {
        acc = 0;
      }
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!armed || window.scrollY > 2) return;
      const dy = (e.touches[0]?.clientY ?? 0) - touchY;
      if (dy > 90) trigger();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      clearTimeout(armTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [pathname, leave]);

  return null;
}
