import { allProjects, type Project } from "contentlayer/generated";

/** Published projects, sorted by `order` (ascending). */
export function getProjects(): Project[] {
  return allProjects.filter((p) => p.published).sort((a, b) => a.order - b.order);
}

/** A single project by slug (includes unpublished, for direct links). */
export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}
