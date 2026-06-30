import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { getProjects } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpellbookCard } from "@/components/spellbook-card";

export const metadata: Metadata = {
  title: "Great Hall",
  description: siteConfig.description,
};

export default function GreatHallPage() {
  const projects = getProjects();
  const featured = projects.slice(0, 3);

  return (
    <div className="container space-y-20 py-12 sm:py-16">
      {/* The Great Hall — the welcome / intro */}
      <section aria-labelledby="great-hall-heading">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          The Great Hall
        </p>
        <h1
          id="great-hall-heading"
          className="mt-3 text-balance font-display text-4xl font-bold leading-tight text-foreground sm:text-6xl"
        >
          {siteConfig.name}
        </h1>
        <p className="mt-3 font-serif text-2xl text-accent-text sm:text-3xl">
          {siteConfig.role}
        </p>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted">
          No muggles allowed here! Hi, I&rsquo;m Phoebe. Explore my tech growth from software engineering to AI development and ask the <strong className="text-foreground">Sorting Hat</strong>{" "}
          anything about me!
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/projects">
              View projects
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sorting-hat">Ask the Sorting Hat</Link>
          </Button>

        </div>
      </section>

      {/* Featured projects */}
      <section aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              The Library
            </p>
            <h2 id="featured-heading" className="mt-2 font-display text-3xl font-bold">
              Featured spellbooks
            </h2>
          </div>
          <Link
            href="/projects"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-text hover:text-gold-hover sm:inline-flex"
          >
            All projects
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <SpellbookCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      {/* Behind the magic teaser */}
      <section className="rounded-card border border-border bg-surface p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">RAG</Badge>
          <Badge variant="muted">Gemini</Badge>
          <Badge variant="muted">Upstash Vector</Badge>
          <Badge variant="muted">Rate-limited + cached</Badge>
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
          The AI features are the portfolio piece
        </h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">
          The Sorting Hat is a real retrieval-augmented generation pipeline: embeddings →
          vector search → a grounded LLM answer with citations, protected by caching and
          rate-limiting. A &ldquo;Behind the Magic&rdquo; panel will show the live
          pipeline. (Wiring lands in Phase 3.)
        </p>
        <div className="mt-6">
          <Button asChild variant="secondary">
            <Link href="/about">How it&rsquo;s built</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
