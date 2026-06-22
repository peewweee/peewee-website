"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * On any content page, scrolling UP while already at the top plays the bright
 * flash and returns to the home castle — which then opens zoomed in on the tower
 * for this page and pulls out to the wide view (see the scene's intro warp).
 */
export function BackToCastle() {
  const pathname = usePathname();
  const router = useRouter();

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
      const flash = document.getElementById("wiz-castle-flash");
      if (flash) {
        flash.style.transition = "opacity 0.22s ease";
        flash.style.opacity = "1";
      }
      try {
        sessionStorage.setItem("wiz:warp", "1");
        sessionStorage.setItem("wiz:from", pathname);
      } catch {
        /* ignore */
      }
      setTimeout(() => router.push("/"), 200);
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
  }, [pathname, router]);

  return null;
}
