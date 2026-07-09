import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About",
  description:
    "The wizard behind the work — Phoebe Rhone Gangoso, a Computer Engineer building production AI.",
};

const skills = [
  "LLM integration",
  "Retrieval-Augmented Generation",
  "Vector search",
  "Prompt engineering",
  "Full-stack",
  "PostgreSQL",
  "Caching",
];

const pipeline = [
  {
    step: "Embed",
    detail:
      "My experience, projects, and personal facts are chunked and embedded by an embedding model.",
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
      "An LLM is instructed to reply using only the retrieved text — never inventing facts.",
  },
  {
    step: "Protect",
    detail:
      "A response cache and per-visitor rate limit guard every request, keeping the Hat fast and free to run.",
  },
];

export default function AboutPage() {
  return (
    <div className="container space-y-16 py-12 sm:py-16">
      <PageHeader
        eyebrow="Potions"
        title="The Magic Behind the Sorting Hat"
      />

      <section className="grid gap-10 md:grid-cols-2">

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
          How the Chatbot Works
        </p>
        <h2
          id="behind-magic"
          className="mt-2 font-display text-2xl font-bold text-foreground"
        >
          The RAG Pipeline
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

    </div>
  );
}
