"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";

import { navItems, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { BackToCastle } from "@/components/back-to-castle";
import { useEnterReveal, requestFlyToTower } from "@/components/page-reveal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Themed, sticky site header. Houses the primary nav (desktop) and an
 *  accessible slide-in menu (mobile). The nav doubles as the keyboard-friendly
 *  fallback for the 3D castle. */
export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the mobile menu on route change.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Nav clicks play the same iris page-reveal as clicking a tower — the
  // destination opens out of the growing reveal (the 3D fly-in is castle-only, so
  // this matches the arrival). Modified clicks and same-page clicks fall through.
  const enter = useEnterReveal();
  const onNavClick = (e: React.MouseEvent, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (pathname === href) return;
    e.preventDefault();
    setMobileOpen(false); // uncover the castle behind the mobile menu before the dive
    // On the castle page, dive into the tower (same as clicking it); on content
    // pages there's no castle to dive through, so fall back to the iris reveal.
    if (!requestFlyToTower(href)) enter(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[rgba(11,16,38,0.72)] backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Castle page → sparkle logo; content pages → animated Back to castle */}
        {pathname === "/" ? (
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-pill font-display text-lg font-bold tracking-wide text-foreground"
          >
            <Sparkles
              className="size-5 text-accent-text transition-transform group-hover:scale-110"
              aria-hidden
            />
            <span className="text-accent-text">{siteConfig.shortName}</span>
          </Link>
        ) : (
          <BackToCastle />
        )}

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => onNavClick(e, item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-pill px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-accent-text"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-px bg-accent shadow-glow"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
            <Link href="/resume">Resume</Link>
          </Button>

          {/* Mobile menu */}
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="left-0 top-0 max-w-full translate-x-0 translate-y-0 rounded-none border-x-0 border-t-0 sm:max-w-full">
              <DialogTitle className="sr-only">Navigation</DialogTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-1 pt-2">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <DialogClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        onClick={(e) => onNavClick(e, item.href)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-field px-3 py-3 text-base font-medium transition-colors",
                          active
                            ? "bg-surface text-accent-text"
                            : "text-foreground-muted hover:bg-surface hover:text-foreground",
                        )}
                      >
                        <span aria-hidden className="text-lg">
                          {item.glyph}
                        </span>
                        <span className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-xs text-foreground-faint">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </DialogClose>
                  );
                })}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
