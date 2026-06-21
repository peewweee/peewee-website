import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "contentlayer/generated";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SpellbookCard — a project case study as a "spellbook" card.
 * Sets `data-house` on its own subtree so the accent reflects the project's
 * house (a live demo of the design system's per-subtree theming). Substance
 * leads: title + summary + stack are scannable in seconds.
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
      data-house={project.house}
      className={cn(
        "group flex flex-col rounded-card border border-border bg-surface p-5 transition-all",
        "hover:-translate-y-1 hover:border-accent hover:shadow-card",
        "focus-visible:shadow-focus focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">
            {project.glyph ?? "✦"}
          </span>
          {project.spell && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-text">
              {project.spell}
            </span>
          )}
        </span>
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

      <h3 className="mt-3 font-display text-xl font-bold text-foreground">
        {project.title}
      </h3>
      <p className="mt-1 font-serif text-sm italic text-foreground-muted">
        {project.themedFraming}
      </p>
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
    </Link>
  );
}
