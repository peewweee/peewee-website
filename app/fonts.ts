import { Cinzel, Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";

/**
 * Fonts loaded via next/font (self-hosted at build time, zero layout shift).
 * Each exposes a CSS variable consumed by `tailwind.config.ts` fontFamily +
 * `app/globals.css`:
 *   --font-cinzel    → display / headings (engraved, magical)
 *   --font-cormorant → editorial serif (hero lines, large quotes)
 *   --font-inter     → UI / body (legibility)
 *   --font-jetbrains → code, token labels, "Behind the Magic"
 */

export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Convenience: all four font CSS-variable classes, applied on <html>. */
export const fontVariables = [
  cinzel.variable,
  cormorant.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(" ");
