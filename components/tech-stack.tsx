import type { ComponentType, CSSProperties } from "react";
import {
  Boxes,
  Brain,
  Database,
  FileInput,
  Infinity,
  PenTool,
  Plug,
  RefreshCw,
  SquareKanban,
  Webhook,
  Workflow,
} from "lucide-react";
import {
  SiApachemaven,
  SiClaudecode,
  SiDocker,
  SiFigma,
  SiFirebase,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGnubash,
  SiGooglegemini,
  SiHtml5,
  SiJavascript,
  SiLangchain,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenjdk,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRender,
  SiSpringboot,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";

import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";

// Both lucide and react-icons render an SVG that inherits `currentColor` and
// accepts className/style — a loose shared type so brand + concept icons mix.
type IconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}>;

type Item = { label: string; icon: IconComponent; color?: string };
type Category = { title: string; items: Item[] };

// Parchment tone for brand marks that are black / near-black (GitHub, Vercel,
// Next.js, …) so they stay visible on the dark background.
const LIGHT = "#f4ecd8";

// OpenAI (Codex) logomark — inlined single-path SVG (Simple Icons dropped OpenAI
// for trademark reasons, so it isn't in react-icons/si). Matches IconComponent.
function OpenAiIcon(props: {
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z" />
    </svg>
  );
}

// Chatbot Builder AI — colored raster logo (no vector mark exists); served from
// public/. Ignores `color` (raster can't inherit currentColor).
function ChatbotBuilderIcon({
  className,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/chatbot-builder-ai.png"
      alt=""
      className={cn("rounded-full object-contain", className)}
      {...props}
    />
  );
}

// `color` = the brand's own colour (Simple Icons) where a logo exists; for the
// concept/practice entries (no brand mark) a distinct hue so they aren't all one
// colour.
const CATEGORIES: Category[] = [
  {
    title: "Languages",
    items: [
      { label: "Bash", icon: SiGnubash, color: "#4EAA25" },
      { label: "HTML", icon: SiHtml5, color: "#E34F26" },
      { label: "Java", icon: SiOpenjdk, color: "#E76F00" },
      { label: "JavaScript", icon: SiJavascript, color: "#F7DF1E" },
      { label: "Python", icon: SiPython, color: "#3776AB" },
      { label: "SQL", icon: Database, color: "#38BDF8" },
      { label: "TypeScript", icon: SiTypescript, color: "#3178C6" },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      { label: "Chatbot Builder AI", icon: ChatbotBuilderIcon },
      { label: "Claude Code", icon: SiClaudecode, color: "#D97757" },
      { label: "Codex", icon: OpenAiIcon, color: LIGHT },
      { label: "Document Ingestion", icon: FileInput, color: "#F59E0B" },
      { label: "Gemini API", icon: SiGooglegemini, color: "#8E75B2" },
      { label: "GenAI", icon: Brain, color: "#C084FC" },
      { label: "Langchain", icon: SiLangchain, color: LIGHT },
      { label: "MCP", icon: Plug, color: "#F472B6" },
      { label: "RAG Pipelines", icon: Workflow, color: "#2DD4BF" },
      { label: "Vector Databases", icon: Boxes, color: "#FB923C" },
      { label: "REST APIs", icon: Webhook, color: "#4ADE80" },
    ],
  },
  {
    title: "Frameworks & Libraries",
    items: [
      { label: "Next.js", icon: SiNextdotjs, color: LIGHT },
      { label: "Node.js", icon: SiNodedotjs, color: "#5FA04E" },
      { label: "React", icon: SiReact, color: "#61DAFB" },
      { label: "Spring Boot", icon: SiSpringboot, color: "#6DB33F" },
      { label: "Tailwind CSS", icon: SiTailwindcss, color: "#06B6D4" },
    ],
  },
  {
    title: "Databases & Cloud Platforms",
    items: [
      { label: "Firebase", icon: SiFirebase, color: "#FFCA28" },
      { label: "H2", icon: Database, color: "#818CF8" },
      { label: "PostgreSQL", icon: SiPostgresql, color: "#4169E1" },
      { label: "Redis", icon: SiRedis, color: "#FF4438" },
      { label: "Render", icon: SiRender, color: "#46E3B7" },
      { label: "Supabase", icon: SiSupabase, color: "#3FCF8E" },
      { label: "Vercel", icon: SiVercel, color: LIGHT },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Docker", icon: SiDocker, color: "#2496ED" },
      { label: "Figma", icon: SiFigma, color: "#F24E1E" },
      { label: "Git", icon: SiGit, color: "#F05032" },
      { label: "GitHub", icon: SiGithub, color: LIGHT },
      { label: "GitHub Actions", icon: SiGithubactions, color: "#2088FF" },
      { label: "Maven", icon: SiApachemaven, color: "#C71A36" },
    ],
  },
  {
    title: "Methodologies & Practices",
    items: [
      { label: "Agile", icon: RefreshCw, color: "#22D3EE" },
      { label: "CI/CD", icon: Infinity, color: "#A3E635" },
      { label: "Scrum", icon: SquareKanban, color: "#FBBF24" },
      { label: "Wireframing", icon: PenTool, color: "#E879F9" },
    ],
  },
];

/** The Tech Stack — skills grouped by category card, each with its coloured icon. */
export function TechStack() {
  return (
    <section aria-labelledby="tech-stack-heading">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
        The Armory
      </p>
      <h2 id="tech-stack-heading" className="mt-2 font-display text-3xl font-bold">
        Tech Stack
      </h2>

      {/* Two columns (row-major): col 1 = Languages / Frameworks / Tools, col 2 =
          AI / Databases / Methodologies. items-stretch = the two cards in each row
          share an equal height. */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-x-8 gap-y-6 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <MagicCard key={cat.title} className="h-full p-5">
            {/* font-sans + font-normal override the global h1–h3 Cinzel/bold base rule */}
            <h3 className="font-sans text-base font-normal text-foreground">
              {cat.title}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {cat.items.map(({ label, icon: Icon, color }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-surface hover:text-foreground"
                >
                  <Icon
                    className={cn("size-4 shrink-0", !color && "text-accent-text")}
                    style={color ? { color } : undefined}
                    aria-hidden
                  />
                  {label}
                </li>
              ))}
            </ul>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}
