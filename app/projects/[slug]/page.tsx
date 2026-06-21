import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { allProjects } from "contentlayer/generated";

import type { ProjectLink } from "@/lib/types";
import { getProjectBySlug } from "@/lib/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MDXContent } from "@/components/mdx-content";

export function generateStaticParams() {
  return allProjects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProjectBySlug(params.slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  if (!project) notFound();

  const links = (project.links as ProjectLink[] | undefined) ?? [];
  const stack = project.stack ?? [];

  return (
    <article data-house={project.house} className="container max-w-3xl py-12 sm:py-16">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-accent-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to the Library
      </Link>

      <header className="mt-6">
        <div className="flex items-center gap-2">
          {project.glyph && (
            <span aria-hidden className="text-3xl">
              {project.glyph}
            </span>
          )}
          {project.spell && (
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
              {project.spell}
            </span>
          )}
          {project.status === "placeholder" && (
            <Badge size="sm" variant="warning">
              Placeholder
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-balance font-display text-4xl font-bold text-foreground sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-3 font-serif text-xl italic text-foreground-muted">
          {project.themedFraming}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
          {project.summary}
        </p>
      </header>

      {/* Quick facts — scannable in seconds */}
      <dl className="mt-8 grid gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2">
        {project.role && (
          <div className="sm:col-span-2">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-accent-text">
              Role
            </dt>
            <dd className="mt-1 text-sm text-foreground-muted">{project.role}</dd>
          </div>
        )}
        {stack.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-accent-text">
              Stack
            </dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {stack.map((tech) => (
                <Badge key={tech} size="sm" variant="outline">
                  {tech}
                </Badge>
              ))}
            </dd>
          </div>
        )}
        {project.outcome && (
          <div className="sm:col-span-2">
            <dt className="font-mono text-xs uppercase tracking-[0.18em] text-accent-text">
              Outcome
            </dt>
            <dd className="mt-1 text-sm text-foreground-muted">{project.outcome}</dd>
          </div>
        )}
      </dl>

      {links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {links.map((link) => (
            <Button key={link.label} asChild variant="secondary" size="sm">
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {link.label}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          ))}
        </div>
      )}

      <div className="mt-10">
        <MDXContent code={project.body.code} />
      </div>
    </article>
  );
}
