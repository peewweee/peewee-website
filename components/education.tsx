import Image from "next/image";

/**
 * Education — the degree plus professional certifications, sitting between the
 * Experiences chronicle and the Projects library on the Great Hall page.
 *
 * Static content, so this stays a server component (no "use client").
 */

/** Each links out to its public credential page. */
const CERTIFICATIONS = [
  {
    name: "AWS Certified AI Practitioner",
    href: "https://www.credly.com/badges/b55389de-bf01-4218-9f75-136917a8c504",
  },
  {
    name: "DataCamp Certified Python Developer Associate",
    href: "https://www.datacamp.com/certificate/PDEVA0010898285517",
  },
];

export function Education() {
  return (
    <section aria-labelledby="education-heading">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
        The Academy
      </p>
      <h2 id="education-heading" className="mt-2 font-display text-3xl font-bold">
        Education
      </h2>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Degree — self-describing, so it carries no heading of its own. The
            logo is decorative (alt="") because the school name sits beside it. */}
        <div className="flex items-start gap-3.5">
          <Image
            src="/logos/PUPLogo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-md bg-surface object-contain p-1 ring-1 ring-border"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold text-accent-text">
              Polytechnic University of the Philippines &ndash; Manila
            </p>
            <p className="mt-1 text-sm text-foreground">
              Bachelor of Science in Computer Engineering
            </p>
            <p className="mt-1.5 font-mono text-xs text-foreground-faint">
              2022 &ndash; 2026
            </p>
            <p className="mt-2 text-sm text-foreground-muted">DOST-SEI Merit Scholar</p>
          </div>
        </div>

        {/* Certifications — each row ruled above and below (`border-t` on every
            row plus `last:border-b` collapses the shared edges, so adjacent rows
            never double up to 2px). Hovering lights a static gradient: brightest
            at the centre, fading out to both sides. */}
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.15em] text-foreground-muted">
            Certifications
          </h3>
          <ul className="mt-4">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert.name} className="border-t border-border last:border-b">
                <a
                  href={cert.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {/* The glow. A gradient is a background-image, which CSS can't
                      transition — so it lives on its own layer and we fade the
                      layer's opacity instead. Focus lights it too, so keyboard
                      users get the same cue as the mouse. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(var(--accent-glow),0.20)_50%,transparent_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                  <span className="relative block py-3 text-sm leading-relaxed text-foreground-muted transition-colors duration-300 group-hover:text-foreground group-focus-visible:text-foreground">
                    {cert.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
