import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { getProjects } from "@/lib/projects";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Phoebe Rhone Gangoso — resume (the acceptance letter). Available to download.",
};

export default function ResumePage() {
  const projects = getProjects();

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="The Owlery"
          title="The acceptance letter"
          lede="The short version, in plain ink. Download the full PDF, or read on."
        >
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Placeholder download — drop the real file at public/resume.pdf */}
            <Button asChild>
              <a href="/resume.pdf" download>
                <Download className="size-4" aria-hidden />
                Download resume (PDF)
              </a>
            </Button>
            <span className="text-xs text-foreground-faint">
              Placeholder — add your PDF at{" "}
              <code className="font-mono">public/resume.pdf</code>.
            </span>
          </div>
        </PageHeader>

        {/* Parchment "letter" */}
        <article className="parchment-surface mt-10 rounded-card p-6 sm:p-10">
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
              Graduating Computer Engineer focused on AI Engineering. Practical experience
              with retrieval-augmented generation, vector search, and prompt engineering,
              plus full-stack and UI/UX work.{" "}
              {/* TODO (Phoebe): tighten to your voice. */}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="font-display text-lg font-bold text-ink">Education</h3>
            <p className="mt-2 text-sm text-ink-muted">
              <strong className="text-ink">
                Polytechnic University of the Philippines — Manila
              </strong>
              <br />
              BS Computer Engineering {/* TODO (Phoebe): graduation year, honors, GPA. */}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="font-display text-lg font-bold text-ink">Selected projects</h3>
            <ul className="mt-2 space-y-2">
              {projects.map((p) => (
                <li key={p.slug} className="text-sm text-ink-muted">
                  <strong className="text-ink">{p.title}</strong> — {p.summary}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="font-display text-lg font-bold text-ink">Skills</h3>
            <p className="mt-2 text-sm text-ink-muted">
              RAG · Vector search · Prompt engineering · LLM integration · Next.js ·
              Spring Boot · PostgreSQL · Redis · UI/UX
              {/* TODO (Phoebe): align exactly with your real resume. */}
            </p>
          </section>
        </article>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Want the highlights conversationally? Ask the Sorting Hat, bottom-right — or{" "}
          <Link href="/contact" className="text-accent-text underline underline-offset-4">
            send an owl
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
