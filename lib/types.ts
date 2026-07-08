/** Shared, framework-agnostic types for the wizarding portfolio. */

/** The five accent themes. `neutral` is the default gold-on-navy. */
export type House = "neutral" | "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";

/** A labelled external/internal link (used by projects, socials, etc.). */
export interface ProjectLink {
  label: string;
  href: string;
}

/** A navigation destination — also a "tower" in the (future) 3D castle. */
export interface NavItem {
  /** Visible label, e.g. "Projects". */
  label: string;
  href: string;
  /** Themed tower name, e.g. "The Library" — used by castle hotspot labels. */
  tower: string;
  /** Short description for menus / hotspot tooltips. */
  description: string;
  /** A single emoji/symbol icon. */
  glyph: string;
}
