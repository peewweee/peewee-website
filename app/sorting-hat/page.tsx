import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Ask the Sorting Hat",
  description:
    "Ask an AI Sorting Hat about Phoebe Rhone Gangoso's work — answered with retrieval-augmented generation, grounded in her resume and project write-ups.",
};

const examples = [
  "What AI work has Phoebe shipped?",
  "Which projects use retrieval-augmented generation?",
  "What's her experience with vector search?",
  "What is she looking for next?",
];

export default function SortingHatPage() {
  return (
    <div className="container space-y-16 py-12 sm:py-16">
      <PageHeader
        eyebrow="Ask the Sorting Hat"
        title="Let the Hat answer"
        lede="The enchanted Sorting Hat answers questions about my work using retrieval-augmented generation — grounded only in my resume and project write-ups, with citations."
      />

      {/* How to summon the Hat (it's a global, floating widget) */}
      <section className="rounded-card border border-border bg-surface p-6 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text">
          How to ask
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
          Summon the Hat, bottom-right
        </h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">
          Tap <span className="font-semibold text-foreground">Ask the Hat</span> in the
          bottom-right corner to open the chat, then ask anything about my projects,
          skills, or experience — the Hat replies from grounded sources.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground-faint">
          <Sparkles className="size-4 text-accent-text" aria-hidden />
          The Hat floats on every page.
        </p>
      </section>

      {/* Example prompts */}
      <section aria-labelledby="examples-heading">
        <h2
          id="examples-heading"
          className="font-display text-2xl font-bold text-foreground"
        >
          Try asking
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {examples.map((q) => (
            <li key={q}>
              <Badge variant="outline">{q}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
