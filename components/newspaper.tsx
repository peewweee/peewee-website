"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A single "Daily Prophet"–style front page. Pure presentational DOM (no
 * three.js), so it can be rendered both inside the 3D scene (via drei's
 * `<Html transform>`) and as the reduced-motion / no-WebGL fallback.
 *
 * The masthead ("Featured Projects") is intentionally identical on every paper.
 */
export type ProphetStory = {
  /** Small category kicker above the headline, e.g. "AI · FinTech". */
  kicker: string;
  /** The big story headline — the project's short name. */
  headline: string;
  /** Subheading under the headline (the project's descriptor). */
  deck: string;
  /** Lead paragraph (gets a drop cap). */
  lead: string;
  /** Tech stack, shown as a small "Built with" line. */
  stack: string[];
  /** Optional cover image (a path in /public). Falls back to an engraving box. */
  photo?: string;
  /** Case-study link. */
  href: string;
};

export const AURA_STORY: ProphetStory = {
  kicker: "DEMO PROJECT",
  headline: "Aura: AI-Powered Financial Intelligence Web App",
  deck: "AI · FinTech",
  lead: "A web app that helps users log expenses in natural language, review extracted transactions, understand spending patterns, and get AI-assisted financial guidance.",
  stack: ["Java", "Spring Boot", "PostgreSQL", "Redis", "Gemini API"],
  photo: "/projects/aura.png",
  href: "/projects",
};

export const CROWDFLOW_STORY: ProphetStory = {
  kicker: "Project Proposal",
  headline: "CrowdFlow: Itinerary Planner",
  deck: "AI",
  lead: "A dynamic, crowd-aware itinerary planner demo that builds a day plan, estimates how crowded each spot is, and automatically reroutes to a similar but emptier place when somewhere gets packed.",
  stack: [
    "Next.js",
    "TypeScript",
    "TailwindCSS",
    "React",
    "Leaflet",
    "Gemini API",
    "OpenWeather",
  ],
  photo: "/projects/crowdflow.png",
  href: "/projects",
};

export function Newspaper({
  story,
  className,
}: {
  story: ProphetStory;
  className?: string;
}) {
  // Show the photo once it loads; if the file is missing, keep the engraving box.
  const [imgOk, setImgOk] = React.useState(true);
  // The WHOLE paper is one link to the story (not just "Read more"); the inner
  // "Read more →" is a visual cue only (a nested <a> would be invalid HTML).
  return (
    <Link
      href={story.href}
      aria-label={`${story.headline} — read more`}
      className={cn(
        "prophet-paper group relative block w-[420px] max-w-full cursor-pointer select-none overflow-hidden rounded-[3px] border border-ink/50 bg-parchment px-4 pb-3.5 pt-2.5 text-ink",
        "shadow-[0_22px_50px_-14px_rgba(0,0,0,0.75)]",
        "bg-gradient-to-b from-parchment to-parchment-2",
        className,
      )}
    >
      {/* Top rule + eyebrow */}
      <div className="flex items-center justify-center gap-2 border-b-2 border-double border-ink pb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-ink-muted">
        <span aria-hidden>✦</span>
        <span>The Daily Prophet</span>
        <span aria-hidden>✦</span>
      </div>

      {/* Masthead — identical on every paper */}
      <h3 className="mt-1 text-center font-blackletter text-[32px] leading-none text-ink">
        Featured Projects
      </h3>

      {/* Dateline */}
      <div className="mt-1 flex items-center justify-between border-y border-ink py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-ink-muted">
        <span>Vol. MMXXVI</span>
        <span>Portfolio Gazette</span>
        <span>Price · 1 Galleon</span>
      </div>

      {/* Kicker */}
      <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.4em] text-ink-muted">
        {story.kicker}
      </p>

      {/* Headline + deck */}
      <h4 className="mt-0.5 text-balance px-2 text-center font-display text-[20px] font-bold leading-[1.05] text-ink">
        {story.headline}
      </h4>
      <p className="mt-0.5 text-balance px-2 text-center font-serif text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {story.deck}
      </p>

      <div className="mx-auto mt-1.5 h-px w-2/3 bg-ink/40" />

      {/* Body: photo + text columns */}
      <div className="mt-2 grid grid-cols-[2fr_0.7fr] gap-4">
        <figure className="m-0 flex flex-col">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-ink/60 bg-parchment-2">
            {story.photo && imgOk ? (
              <Image
                src={story.photo}
                alt=""
                fill
                sizes="320px"
                onError={() => setImgOk(false)}
                className="object-cover grayscale contrast-[1.1] mix-blend-multiply"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(34,28,14,0.07)_5px,rgba(34,28,14,0.07)_6px)] text-center font-mono text-[7px] uppercase tracking-[0.2em] text-ink-faint">
                Illustration
              </div>
            )}
          </div>
          <span
            aria-hidden
            className="mt-2 inline-block font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-2 group-hover:underline"
          >
            Read more →
          </span>
        </figure>

        <div className="text-[9px] leading-[1.36] text-ink">
          <p className="first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-[26px] first-letter:font-bold first-letter:leading-[0.75] first-letter:text-ink">
            {story.lead}
          </p>
          <figcaption className="mt-4 font-mono text-[8px] uppercase leading-tight tracking-[0.2em] text-ink-muted">
            Built with {story.stack.join(" · ")}
          </figcaption>
        </div>
      </div>
    </Link>
  );
}
