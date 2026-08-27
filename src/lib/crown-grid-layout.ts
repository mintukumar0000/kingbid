/** Bento grid placement — crown-shaped kingdom map (Brand My Mac lid style). */

export type CrownGridSize = "sm" | "md" | "lg" | "xl";

export type CrownGridSlot = {
  area: string;
  size: CrownGridSize;
  label: string;
};

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

export const CROWN_GRID_AREAS = `
  ". ai saas startups . ."
  "dev dev center center coding coding"
  "design design center center marketing marketing"
  "usa india nepal uk x threads"
`;
