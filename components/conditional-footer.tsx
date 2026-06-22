"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "./site-footer";

/** The footer, hidden on the home page (the full-screen castle stands alone). */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <SiteFooter />;
}
