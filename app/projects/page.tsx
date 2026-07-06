import type { Metadata } from "next";

import { getProjects } from "@/lib/projects";
import { PageHeader } from "@/components/page-header";
import { SpellbookCard } from "@/components/spellbook-card";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Case studies kept as spellbook cards — AI, full-stack, and UI/UX work by Phoebe Rhone Gangoso.",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="container space-y-10 py-12 sm:py-16">
      <PageHeader
        eyebrow="The Library"
        title="Projects"
        lede="An overview of my work across full-stack development and AI systems."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <SpellbookCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
