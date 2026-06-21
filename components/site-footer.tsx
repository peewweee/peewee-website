import Link from "next/link";

import { navItems, siteConfig } from "@/lib/site";

/** Themed footer with the accessible text nav repeated and social links. */
export function SiteFooter() {
  const year = 2026; // Static to keep server/client render deterministic.
  return (
    <footer className="mt-24 border-t border-border bg-bg-sunken">
      <div className="container flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold text-accent-text">
              {siteConfig.name}
            </p>
            <p className="mt-2 text-sm text-foreground-muted">{siteConfig.tagline}</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-foreground-muted transition-colors hover:text-accent-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {siteConfig.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className="text-sm text-foreground-muted transition-colors hover:text-accent-text"
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-foreground-faint">
          © {year} {siteConfig.name}. An original wizarding-inspired fan tribute — no
          official marks or scores used.
        </p>
      </div>
    </footer>
  );
}
