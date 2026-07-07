import type { NavItem, ProjectLink } from "./types";

/**
 * Central site configuration. Edit names, links, and copy here.
 * NOTE: the production domain is intentionally NOT hardcoded (undecided).
 * `metadataBase` falls back to localhost; set NEXT_PUBLIC_SITE_URL in the
 * environment for production OG/canonical URLs.
 */
export const siteConfig = {
  name: "Phoebe Rhone Gangoso",
  shortName: "Peewee",
  role: "Software & AI Developer",
  // Headline differentiator from the brief.
  tagline: "Software & AI Developer",
  description:
    "Harry Potter–themed portfolio of Phoebe Rhone Gangoso — graduating Computer Engineer pursuing AI Engineering. An AI 'Sorting Hat' answers questions about her work via retrieval-augmented generation.",
  // Swap '#' for real profiles. Do not commit private addresses.
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/phoeberhone/" },
    { label: "GitHub", href: "https://github.com/peewweee" },
    { label: "Email", href: "mailto:phoeberhonegangoso@gmail.com" },
    { label: "Facebook", href: "https://www.facebook.com/phoeberhone/" },
  ] satisfies ProjectLink[],
} as const;

/**
 * Primary navigation — each item is also a "tower" in the future 3D castle.
 * This list IS the accessible fallback menu; the castle is an enhancement on top.
 */
// `label` is the short name shown in the header/footer nav; `tower` is the
// themed name shown on the 3D castle structure. The array order is the nav-bar
// order — the 3D scene picks each structure by `href`, so it stays independent
// of this ordering.
export const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/great-hall",
    tower: "Great Hall",
    description: "Welcome — meet the wizard and the Sorting Hat.",
    glyph: "🏰",
  },
  {
    label: "Sorting Hat",
    href: "/sorting-hat",
    tower: "Ask the Sorting Hat",
    description: "Ask the enchanted Hat about my work.",
    glyph: "🎩",
  },
  {
    label: "Projects",
    href: "/projects",
    tower: "Library",
    description: "Case studies, kept in spellbook cards.",
    glyph: "📚",
  },
  {
    label: "Contact",
    href: "/contact",
    tower: "Owlery",
    description: "Send an owl.",
    glyph: "🦉",
  },
  {
    label: "About",
    href: "/about",
    tower: "Potions",
    description: "The wizard behind the work.",
    glyph: "⚗️",
  },
];

/** Absolute base URL for metadata; never hardcodes a production domain. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
