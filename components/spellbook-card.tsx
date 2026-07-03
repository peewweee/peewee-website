import Image from "next/image";
import type { Project } from "contentlayer/generated";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SpellbookCard — a project preview. The project's image fills the card; the
 * bottom fades to the card colour, and the details sit over that fade. The whole
 * card links out to the live project (new tab).
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
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex min-h-[25rem] flex-col justify-end overflow-hidden rounded-card border border-border p-5 transition-all",
        "hover:-translate-y-1 hover:border-accent hover:shadow-card",
        "focus-visible:shadow-focus focus-visible:outline-none",
        className,
      )}
    >
      {/* Background: the project image, or a plain surface as fallback */}
      {project.cover ? (
        <Image
          src={project.cover}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover object-top"
        />
      ) : (
        <span className="absolute inset-0 bg-surface" />
      )}

      {/* Bottom fade to the card colour (surface #161b38). Multi-stop ease so the
          fade is smooth (no hard edge) and clears to transparent at ~80%. */}
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#161b38_0%,#161b38_40%,rgba(22,27,56,0.85)_52%,rgba(22,27,56,0.62)_62%,rgba(22,27,56,0.38)_70%,rgba(22,27,56,0.16)_77%,transparent_82%)]" />

      {/* Details — pushed to the bottom, sitting over the fade */}
      <div className="relative z-10">
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

        <h3 className="mt-2 font-display text-xl font-bold text-foreground [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {project.summary}
        </p>

        {stack.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {stack.map((tech) => (
              <li key={tech}>
                <Badge size="sm" variant="outline">
                  {tech}
                </Badge>
              </li>
            ))}
          </ul>
        )}

      </div>
    </a>
  );
}
