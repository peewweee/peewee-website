/**
 * Read design-system CSS variables at runtime so non-CSS consumers (the R3F
 * castle scene) share the exact same tokens — gold `--accent`, the
 * `--accent-glow` triplet, and the night-sky base colors. Reading from a themed
 * element means `data-house` overrides flow through automatically.
 *
 * Client-only (uses getComputedStyle); guard before calling on the server.
 */

export interface CastleTheme {
  bg: string;
  bgSunken: string;
  bgElev: string;
  accent: string;
  accentText: string;
  /** A THREE-parseable `rgb(r,g,b)` built from the `--accent-glow` triplet. */
  accentGlow: string;
}

export function readCssVar(name: string, el?: Element | null): string {
  if (typeof window === "undefined") return "";
  const target = el ?? document.body ?? document.documentElement;
  return getComputedStyle(target).getPropertyValue(name).trim();
}

/** Read the castle's color tokens from a themed element (defaults to <body>). */
export function readCastleTheme(el?: Element | null): CastleTheme {
  const glowTriplet = readCssVar("--accent-glow", el) || "212, 175, 55";
  return {
    bg: readCssVar("--bg", el) || "#0b1026",
    bgSunken: readCssVar("--bg-sunken", el) || "#070a18",
    bgElev: readCssVar("--bg-elev", el) || "#10152e",
    accent: readCssVar("--accent", el) || "#d4af37",
    accentText: readCssVar("--accent-text", el) || "#e8c766",
    accentGlow: `rgb(${glowTriplet.replace(/\s+/g, "")})`,
  };
}
