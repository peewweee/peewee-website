import type { Metadata, Viewport } from "next";

import "./globals.css";
import { fontVariables } from "./fonts";
import { siteConfig, getSiteUrl } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { ConditionalFooter } from "@/components/conditional-footer";
import { SortingHat } from "@/components/sorting-hat/sorting-hat";
import { Atmosphere } from "@/components/atmosphere/atmosphere";
import { RouteFlash } from "@/components/route-flash";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
    type: "website",
  },
  // TODO (Phase 5): add OG images + per-page metadata.
};

export const viewport: Viewport = {
  themeColor: "#0b1026",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      {/* data-house sets the active accent theme; "Get Sorted" (Phase 3) swaps it. */}
      <body data-house="neutral" className="antialiased">
        <a
          href="#main-content"
          className="skip-link rounded-field bg-gold px-4 py-2 text-sm font-semibold text-gold-ink"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <ConditionalFooter />
        </div>

        {/* Global, on every page (Phase 3/4 stubs) */}
        <SortingHat />
        <Atmosphere />
        <RouteFlash />
      </body>
    </html>
  );
}
