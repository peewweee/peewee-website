import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Phoebe Rhone Gangoso — resume (the acceptance letter). Available to download.",
};

// The visible teaser ends at this sentence; Education fades out beneath it and
// the full résumé (projects, skills, the rest) lives in the downloadable PDF.
const SUMMARY_LEAD =
  "4th-year Computer Engineering student at Polytechnic University of the Philippines - Manila with a foundation in Full-Stack Software Engineering and an active focus on GenAI and Workflow Automation.";

// Fades the previewed content to transparent (the parchment shows through).
// Opaque through the "Education" heading, then dissolves into the university line.
const FADE_MASK =
  "[mask-image:linear-gradient(to_bottom,#000,#000_30%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000,#000_30%,transparent)]";

export default function ResumePage() {
  return (
    <div className="container py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Column 1 — the page header. */}
        <div>
          <PageHeader
            eyebrow="The Magic Spellbook"
            title="Resume"
            lede="A preview of my resume — download the full PDF."
          />

          <p className="mt-6 text-sm text-foreground-muted">
            Prefer to chat? Ask the{" "}
            <Link
              href="/sorting-hat"
              className="text-accent-text underline underline-offset-4"
            >
              Sorting Hat
            </Link>{" "}
            — or{" "}
            <Link
              href="/contact"
              className="text-accent-text underline underline-offset-4"
            >
              send an owl
            </Link>
            .
          </p>
        </div>

        {/* Column 2 — the résumé preview + chat prompt. */}
        <div>
          {/* Parchment "letter" — the top shows; it fades into a download CTA. */}
          <article className="parchment-surface rounded-card p-6 sm:p-10">
            <header className="border-b border-border-ink pb-4">
              <h2 className="font-display text-2xl font-bold text-ink">
                {siteConfig.name}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {siteConfig.role} · BS Computer Engineering, PUP Manila
              </p>
            </header>

            <section className="mt-6">
              <h3 className="font-display text-lg font-bold text-ink">Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {SUMMARY_LEAD}
              </p>
            </section>

            {/* Education fades out from here — the rest is in the PDF. */}
            <div className={`mt-6 max-h-44 overflow-hidden pb-6 ${FADE_MASK}`}>
              <section>
                <h3 className="font-display text-lg font-bold text-ink">Education</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  <strong className="text-ink">
                    Polytechnic University of the Philippines — Manila
                  </strong>
                  <br />
                  BS Computer Engineering
                </p>
              </section>
            </div>

            {/* Download CTA, pulled up over the fade. */}
            <div className="relative z-10 -mt-6 flex flex-col items-center gap-2 text-center">
              <Button asChild>
                <a href="/resume.pdf" download>
                  <Download className="size-4" aria-hidden />
                  Download Resume
                </a>
              </Button>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}
