import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "The wizard behind the work — Phoebe Rhone Gangoso, a Computer Engineer building production AI.",
};

const skills = [
  "Retrieval-Augmented Generation",
  "Vector search",
  "Prompt engineering",
  "LLM integration",
  "Full-stack web (Next.js, Spring Boot)",
  "PostgreSQL · Redis",
  "UI/UX design",
];

const pipeline = [
  {
    step: "Embed",
    detail:
      "My résumé, projects, and personal facts are chunked and embedded with Gemini.",
  },
  {
    step: "Index",
    detail:
      "The embeddings are committed to a local index file — no external vector database.",
  },
  {
    step: "Retrieve",
    detail:
      "A question is embedded and matched to the closest chunks by cosine similarity.",
  },
  {
    step: "Answer",
    detail:
      "Gemini Flash-Lite streams a reply grounded only in the retrieved text, with citations.",
  },
  {
    step: "Protect",
    detail:
      "Upstash Redis caching + per-visitor rate-limiting keep it fast and free to run.",
  },
];

export default function AboutPage() {
  return (
    <div className="container space-y-16 py-12 sm:py-16">
      <PageHeader
        eyebrow="The Study"
        title="The wizard behind it"
        lede="I'm Phoebe — a graduating BS Computer Engineering student at PUP Manila, aiming squarely at AI Engineering. I like turning fuzzy, unstructured problems into shipped, grounded systems."
      />

      <section className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4 text-foreground-muted">
          <h2 className="font-display text-2xl font-bold text-foreground">My approach</h2>
          <p>
            I have hands-on AI experience — RAG, vector search, and prompt engineering —
            but only a few standalone AI projects. So I made the website itself the proof:
            the Sorting Hat is a real production AI feature, not a line on a list.
          </p>
          <p>
            The guiding principle here is simple: the theme is a wrapper; the substance is
            real. The magic earns attention; the engineering keeps it.
          </p>
          {/* TODO (Phoebe): personalize — a sentence or two in your own voice, a photo,
              and anything about what you're looking for next. */}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Skills</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s}>
                <Badge variant="outline">{s}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Behind the Magic — static summary of the live RAG pipeline */}
      <section
        aria-labelledby="behind-magic"
        className="rounded-card border border-border bg-surface p-6 sm:p-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          Behind the Magic
        </p>
        <h2
          id="behind-magic"
          className="mt-2 font-display text-2xl font-bold text-foreground"
        >
          How the Sorting Hat answers
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pipeline.map((p, i) => (
            <li
              key={p.step}
              className="rounded-card border border-border bg-bg-sunken p-4"
            >
              <span className="font-mono text-xs text-accent-text">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 font-display text-lg font-bold text-foreground">
                {p.step}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">{p.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/projects">See the work</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/resume">Read the resume</Link>
        </Button>
      </section>
    </div>
  );
}
