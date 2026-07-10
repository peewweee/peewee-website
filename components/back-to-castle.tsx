"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { navItems } from "@/lib/site";
import { useLeaveReveal } from "@/components/page-reveal";

/**
 * A minimal top-left "Back to castle" control shown on every content page.
 * Clicking it plays the iris close over the current page, then returns to the
 * home castle — which opens zoomed-in on this page's tower and settles into place
 * (see page-reveal.tsx + the scene's intro warp). Rendered in the header's
 * top-left slot on content pages (in place of the logo); the header shows the
 * logo on the home castle instead. Matches the header nav links' font + hover.
 */
export function BackToCastle() {
  const pathname = usePathname();
  const leave = useLeaveReveal();
  const leavingRef = React.useRef(false);

  if (pathname === "/") return null;

  // The exit (iris close + zoom-out) only plays if THIS page was entered through a
  // tower/window — PortalTransition tags that as wiz:entry="transition" on arrival.
  // Navbar / plain-link arrivals are "plain", so "Back to castle" navigates plainly.
  const hasTower = navItems.some((item) => item.href === pathname);
  const enteredViaWindow = () => {
    try {
      return sessionStorage.getItem("wiz:entry") === "transition";
    } catch {
      return false;
    }
  };

  const go = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    // Remember which page we left so the castle opens zoomed-in on its tower.
    try {
      sessionStorage.setItem("wiz:from", pathname);
    } catch {
      /* ignore */
    }
    // Shrink this page into a closing circle, revealing the castle underneath.
    leave("/");
  };

  return (
    <Link
      href="/"
      onClick={(e) => {
        // Only pages entered through their tower/window get the exit transition;
        // everything else navigates normally (no animation).
        if (!hasTower || !enteredViaWindow()) {
          // Plain exit — drop any stale zoom-out target so the castle just opens.
          try {
            sessionStorage.removeItem("wiz:from");
          } catch {
            /* ignore */
          }
          return;
        }
        e.preventDefault();
        go();
      }}
      aria-label="Back to the castle"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to castle
    </Link>
  );
}
