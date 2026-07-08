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

  // Only pages that ARE a castle tower get the zoom-in + iris transition. Pages
  // with no tower (e.g. /resume) just open the castle in its default view.
  const hasTower = navItems.some((item) => item.href === pathname);

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
        // No tower for this page → let the link navigate normally (no animation).
        if (!hasTower) return;
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
