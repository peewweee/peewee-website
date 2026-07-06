import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { FeaturedProphet } from "@/components/featured-prophet";
import { TechStack } from "@/components/tech-stack";
import { Experience } from "@/components/experience";

export const metadata: Metadata = {
  title: "Great Hall",
  description: siteConfig.description,
};

export default function GreatHallPage() {
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
          No Muggles allowed! Hi, I&rsquo;m Phoebe. Explore my tech growth from software engineering to AI development and ask the <strong className="text-foreground">Sorting Hat</strong>{" "}
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

      {/* Tech Stack — grouped skills + icons, before the Library/Projects */}
      <TechStack />

      {/* Experiences — work history + leadership, below the Tech Stack */}
      <Experience />

      {/* Featured projects — a "Daily Prophet" front page in 3D */}
      <section aria-labelledby="featured-heading">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
            The Library
          </p>
          <h2 id="featured-heading" className="mt-2 font-display text-3xl font-bold">
            Projects
          </h2>
        </div>

        <FeaturedProphet />
      </section>

      {/* Behind the magic teaser */}
      <section className="rounded-card border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          The magic behind the Sorting Hat
        </h2>
        <p className="mt-3 text-foreground-muted">
          The Sorting Hat is an AI-powered chatbot designed to answer questions about my background, projects, and experience. It is customized to respond in the character of the Sorting Hat.
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
