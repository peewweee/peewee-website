import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { SortingHat } from "@/components/sorting-hat/sorting-hat";

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

      {/* The Hat's chat, inline on its own page */}
      <SortingHat />

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
