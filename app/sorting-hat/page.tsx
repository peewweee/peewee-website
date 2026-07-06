import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { SortingHat } from "@/components/sorting-hat/sorting-hat";

export const metadata: Metadata = {
  title: "Ask the Sorting Hat",
  description:
    "Ask an AI Sorting Hat about Phoebe Rhone Gangoso's work — answered with retrieval-augmented generation, grounded in her resume and project write-ups.",
};

export default function SortingHatPage() {
  return (
    <div className="container space-y-10 py-12 sm:py-16">
      <PageHeader
        eyebrow="Ask the Sorting Hat"
        title="The Sorting Hat"
      />

      {/* The Hat's chat, inline on its own page */}
      <SortingHat />

    </div>
  );
}
