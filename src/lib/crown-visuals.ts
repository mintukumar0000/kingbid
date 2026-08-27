import type { CrownDefinition } from "@/lib/crowns";

export type CrownVisual = {
  icon: string;
  accent: string;
  accentRgb: string;
  glow: string;
  mesh: string;
};

const DEFAULT: CrownVisual = {
  icon: "👑",
  accent: "#c9a227",
  accentRgb: "201, 162, 39",
  glow: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,162,39,0.18), transparent 70%)",
  mesh: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
};

const MAP: Record<string, Partial<CrownVisual>> = {
  "king-of-ai": { icon: "🤖", accent: "#6ee7ff", accentRgb: "110, 231, 255", glow: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(110,231,255,0.15), transparent 70%)" },
  "king-of-saas": { icon: "☁️", accent: "#8b9cff", accentRgb: "139, 156, 255" },
  "king-of-startups": { icon: "🚀", accent: "#ff9f6b", accentRgb: "255, 159, 107" },
  "king-of-developers": { icon: "⌘", accent: "#a78bfa", accentRgb: "167, 139, 250" },
  "king-of-coding": { icon: "{ }", accent: "#34d399", accentRgb: "52, 211, 153" },
  "king-of-design": { icon: "◈", accent: "#f472b6", accentRgb: "244, 114, 182" },
  "king-of-marketing": { icon: "📈", accent: "#fbbf24", accentRgb: "251, 191, 36" },
  "king-of-usa": { icon: "🇺🇸", accent: "#60a5fa", accentRgb: "96, 165, 250" },
  "king-of-india": { icon: "🇮🇳", accent: "#fb923c", accentRgb: "251, 146, 60" },
  "king-of-nepal": { icon: "🇳🇵", accent: "#f87171", accentRgb: "248, 113, 113" },
  "king-of-uk": { icon: "🇬🇧", accent: "#818cf8", accentRgb: "129, 140, 248" },
  "king-of-x": { icon: "𝕏", accent: "#e7e5e4", accentRgb: "231, 229, 228" },
  "king-of-threads": { icon: "@", accent: "#d6d3d1", accentRgb: "214, 211, 209" },
  "king-of-the-internet": { icon: "🌐", accent: "#c9a227", accentRgb: "201, 162, 39", glow: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(201,162,39,0.22), transparent 70%)" },
};

export function crownVisual(slug: string): CrownVisual {
  return { ...DEFAULT, ...MAP[slug] };
}

export function crownThemeClass(theme: CrownDefinition["theme"]): string {
  if (theme === "tech") return "crown-theme-tech";
  if (theme === "places") return "crown-theme-places";
  return "crown-theme-internet";
}
