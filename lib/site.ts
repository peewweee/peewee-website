import type { NavItem, ProjectLink } from "./types";

/**
 * Central site configuration. Edit names, links, and copy here.
 * NOTE: the production domain is intentionally NOT hardcoded (undecided).
 * `metadataBase` falls back to localhost; set NEXT_PUBLIC_SITE_URL in the
 * environment for production OG/canonical URLs.
 */
export const siteConfig = {
  name: "Phoebe Rhone Gangoso",
  shortName: "Phoebe R. Gangoso",
  role: "AI Engineer",
  // Headline differentiator from the brief.
  tagline: "The castle makes me memorable; the Hat makes me hireable.",
  description:
    "Harry Potter–themed portfolio of Phoebe Rhone Gangoso — graduating Computer Engineer pursuing AI Engineering. An AI 'Sorting Hat' answers questions about her work via retrieval-augmented generation.",
  // Swap '#' for real profiles. Do not commit private addresses.
  socials: [
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Email", href: "#" },
  ] satisfies ProjectLink[],
} as const;

/**
 * Primary navigation — each item is also a "tower" in the future 3D castle.
 * This list IS the accessible fallback menu; the castle is an enhancement on top.
 */
export const navItems: NavItem[] = [
  {
    label: "Great Hall",
    href: "/",
    tower: "The Great Hall",
    description: "Welcome — meet the wizard and the Sorting Hat.",
    glyph: "🏰",
  },
  {
    label: "Projects",
    href: "/projects",
    tower: "The Library",
    description: "Case studies, kept in spellbook cards.",
    glyph: "📚",
  },
  {
    label: "About",
    href: "/about",
    tower: "The Study",
    description: "The wizard behind the work.",
    glyph: "🪄",
  },
  {
    label: "Resume",
    href: "/resume",
    tower: "The Owlery",
    description: "An acceptance letter — downloadable.",
    glyph: "📜",
  },
  {
    label: "Contact",
    href: "/contact",
    tower: "The Owl Post",
    description: "Send an owl.",
    glyph: "🦉",
  },
];

/** Absolute base URL for metadata; never hardcodes a production domain. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
