import type { House, HouseTheme } from "./types";

/**
 * House theme map — mirrors the `houses` array in the design system style guide.
 * Used by the "Get Sorted" feature (Phase 3) to swap the accent on a subtree by
 * setting `data-house`. The actual color values live in `app/globals.css`; this
 * map carries names + metadata for the sorting UI/logic.
 */
export const houses: Record<House, HouseTheme> = {
  neutral: {
    key: "neutral",
    name: "Unsorted",
    accent: "#d4af37",
    accent2: "#c8a24a",
    accentText: "#e8c766",
    accentInk: "#1a1206",
    glow: "212, 175, 55",
  },
  gryffindor: {
    key: "gryffindor",
    name: "Gryffindor",
    accent: "#b11e36",
    accent2: "#d4af37",
    accentText: "#f0a39a",
    accentInk: "#fff3e6",
    glow: "177, 30, 54",
  },
  slytherin: {
    key: "slytherin",
    name: "Slytherin",
    accent: "#1f7a52",
    accent2: "#bfc6ce",
    accentText: "#6fd3a1",
    accentInk: "#06170f",
    glow: "31, 122, 82",
  },
  ravenclaw: {
    key: "ravenclaw",
    name: "Ravenclaw",
    accent: "#2e5bbf",
    accent2: "#b08d57",
    accentText: "#8fb2f2",
    accentInk: "#f2f5ff",
    glow: "46, 91, 191",
  },
  hufflepuff: {
    key: "hufflepuff",
    name: "Hufflepuff",
    accent: "#e8b71e",
    accent2: "#1a1a1a",
    accentText: "#f2c94c",
    accentInk: "#2a2200",
    glow: "232, 183, 30",
  },
};

export const houseList: HouseTheme[] = Object.values(houses);
