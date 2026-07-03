import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Project } from "contentlayer/generated";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SpellbookCard — a project case study preview. The project's cover image is the
 * card background (with a legibility overlay); the accent is the neutral gold.
 */
export function SpellbookCard({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const stack = project.stack ?? [];
  return (
    <Link
      href={project.url}
      className={cn(
        "group relative flex min-h-[15rem] flex-col overflow-hidden rounded-card border border-border p-5 transition-all",
        "hover:-translate-y-1 hover:border-accent hover:shadow-card",
        "focus-visible:shadow-focus focus-visible:outline-none",
        className,
      )}
    >
      {/* Background: the project image (dark overlay for legibility) or a surface */}
      {project.cover ? (
        <>
          <Image
            src={project.cover}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-bg-sunken via-bg-sunken/85 to-bg-sunken/45" />
        </>
      ) : (
        <span className="absolute inset-0 bg-surface" />
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          {project.category && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-text [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              {project.category}
            </span>
          )}
          {project.status === "placeholder" && (
            <Badge size="sm" variant="warning">
              Placeholder
            </Badge>
          )}
          {project.status === "wip" && (
            <Badge size="sm" variant="muted">
              In progress
            </Badge>
          )}
        </div>

        <h3 className="mt-3 font-display text-xl font-bold text-foreground [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
          {project.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          {project.summary}
        </p>

        {stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {stack.slice(0, 4).map((tech) => (
              <li key={tech}>
                <Badge size="sm" variant="outline">
                  {tech}
                </Badge>
              </li>
            ))}
            {stack.length > 4 && (
              <li>
                <Badge size="sm" variant="outline">
                  +{stack.length - 4}
                </Badge>
              </li>
            )}
          </ul>
        )}

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
          Read the case study
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
