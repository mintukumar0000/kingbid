/** Bento grid placement — full kingdom + per-category maps. */

import type { CrownGroup } from "@/lib/crowns";

export type CrownGridSize = "sm" | "md" | "lg" | "xl";

export type CrownGridSlot = {
  area: string;
  size: CrownGridSize;
  label: string;
};

export type GridVariant = "all" | CrownGroup;

/** Full 14-crown kingdom (All view) */
export const CROWN_GRID_SLOTS: Record<string, CrownGridSlot> = {
  "king-of-ai": { area: "ai", size: "sm", label: "AI" },
  "king-of-saas": { area: "saas", size: "sm", label: "SaaS" },
  "king-of-startups": { area: "startups", size: "sm", label: "Startups" },
  "king-of-developers": { area: "dev", size: "md", label: "Developers" },
  "king-of-coding": { area: "coding", size: "md", label: "Coding" },
  "king-of-design": { area: "design", size: "md", label: "Design" },
  "king-of-marketing": { area: "marketing", size: "md", label: "Marketing" },
  "king-of-the-internet": { area: "center", size: "xl", label: "Internet" },
  "king-of-usa": { area: "usa", size: "sm", label: "USA" },
  "king-of-india": { area: "india", size: "sm", label: "India" },
  "king-of-nepal": { area: "nepal", size: "sm", label: "Nepal" },
  "king-of-uk": { area: "uk", size: "sm", label: "UK" },
  "king-of-x": { area: "x", size: "sm", label: "X" },
  "king-of-threads": { area: "threads", size: "sm", label: "Threads" },
};

/** Tech vertical — AI throne at center */
export const TECH_GRID_SLOTS: Record<string, CrownGridSlot> = {
  "king-of-ai": { area: "hub", size: "xl", label: "AI" },
  "king-of-saas": { area: "saas", size: "sm", label: "SaaS" },
  "king-of-startups": { area: "startups", size: "sm", label: "Startups" },
  "king-of-developers": { area: "dev", size: "md", label: "Developers" },
  "king-of-coding": { area: "coding", size: "md", label: "Coding" },
  "king-of-design": { area: "design", size: "md", label: "Design" },
  "king-of-marketing": { area: "marketing", size: "md", label: "Marketing" },
};

/** Places — 2×2 territory map */
export const PLACES_GRID_SLOTS: Record<string, CrownGridSlot> = {
  "king-of-usa": { area: "usa", size: "lg", label: "USA" },
  "king-of-india": { area: "india", size: "lg", label: "India" },
  "king-of-nepal": { area: "nepal", size: "lg", label: "Nepal" },
  "king-of-uk": { area: "uk", size: "lg", label: "UK" },
};

/** Internet platforms — Internet crown at center */
export const INTERNET_GRID_SLOTS: Record<string, CrownGridSlot> = {
  "king-of-the-internet": { area: "center", size: "xl", label: "Internet" },
  "king-of-x": { area: "x", size: "md", label: "X" },
  "king-of-threads": { area: "threads", size: "md", label: "Threads" },
};

export const GRID_CSS_CLASS: Record<GridVariant, string> = {
  all: "kingdom-grid",
  tech: "kingdom-grid-tech",
  places: "kingdom-grid-places",
  internet: "kingdom-grid-internet",
};

export function gridSlotsForVariant(variant: GridVariant): Record<string, CrownGridSlot> {
  if (variant === "tech") return TECH_GRID_SLOTS;
  if (variant === "places") return PLACES_GRID_SLOTS;
  if (variant === "internet") return INTERNET_GRID_SLOTS;
  return CROWN_GRID_SLOTS;
}

export function gridVariantForFilter(filter: string): GridVariant | null {
  if (filter === "tech" || filter === "places" || filter === "internet") return filter;
  if (filter === "all") return "all";
  return null;
}
