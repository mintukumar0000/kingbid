// Luxury room themes — each category board feels like entering a private lounge.

import { LAUNCH_CATEGORIES } from "@/lib/categories";

export type CategoryRoomTheme = {
  slug: string;
  name: string;
  description: string;
  /** Short label above the title, e.g. "THE ATrium" */
  roomLabel: string;
  /** One-line prestige hook */
  motto: string;
  icon: string;
  preset: keyof typeof LUXURY_PRESETS;
  isMeta?: boolean;
};

export const LUXURY_PRESETS = {
  obsidianGold: {
    bg: "linear-gradient(165deg, #0f0c0a 0%, #1c1612 45%, #2a2118 100%)",
    glow: "rgba(201, 169, 98, 0.35)",
    accent: "#c9a962",
    accentSoft: "rgba(201, 169, 98, 0.15)",
    text: "#f5efe6",
    muted: "#a89888",
    border: "rgba(201, 169, 98, 0.28)",
    shimmer: "rgba(255, 236, 200, 0.08)",
  },
  midnightSapphire: {
    bg: "linear-gradient(165deg, #060d18 0%, #0f1a2e 50%, #152238 100%)",
    glow: "rgba(120, 160, 220, 0.3)",
    accent: "#8eb4e8",
    accentSoft: "rgba(142, 180, 232, 0.12)",
    text: "#eef4fc",
    muted: "#8a9bb0",
    border: "rgba(142, 180, 232, 0.25)",
    shimmer: "rgba(200, 220, 255, 0.06)",
  },
  burgundyVelvet: {
    bg: "linear-gradient(165deg, #140810 0%, #2a1018 48%, #3d1824 100%)",
    glow: "rgba(232, 180, 160, 0.28)",
    accent: "#e8b4a0",
    accentSoft: "rgba(232, 180, 160, 0.12)",
    text: "#faf0ec",
    muted: "#b09088",
    border: "rgba(232, 180, 160, 0.22)",
    shimmer: "rgba(255, 220, 210, 0.07)",
  },
  emeraldLounge: {
    bg: "linear-gradient(165deg, #080f0c 0%, #0f1a14 50%, #1a2e22 100%)",
    glow: "rgba(180, 200, 160, 0.25)",
    accent: "#b8c8a8",
    accentSoft: "rgba(184, 200, 168, 0.12)",
    text: "#eef5ea",
    muted: "#889880",
    border: "rgba(184, 200, 168, 0.22)",
    shimmer: "rgba(220, 240, 210, 0.06)",
  },
  charcoalPlatinum: {
    bg: "linear-gradient(165deg, #0a0a0a 0%, #141414 50%, #222222 100%)",
    glow: "rgba(220, 220, 220, 0.2)",
    accent: "#d4d4d4",
    accentSoft: "rgba(212, 212, 212, 0.1)",
    text: "#f5f5f5",
    muted: "#909090",
    border: "rgba(212, 212, 212, 0.2)",
    shimmer: "rgba(255, 255, 255, 0.05)",
  },
  deepAmethyst: {
    bg: "linear-gradient(165deg, #0c0818 0%, #1a1028 50%, #2a1840 100%)",
    glow: "rgba(180, 140, 220, 0.3)",
    accent: "#c4a0e8",
    accentSoft: "rgba(196, 160, 232, 0.12)",
    text: "#f3eef8",
    muted: "#9888a8",
    border: "rgba(196, 160, 232, 0.25)",
    shimmer: "rgba(230, 210, 255, 0.07)",
  },
} as const;

const PRESET_KEYS = Object.keys(LUXURY_PRESETS) as (keyof typeof LUXURY_PRESETS)[];

const ROOM_META: Record<
  string,
  Pick<CategoryRoomTheme, "roomLabel" | "motto" | "icon" | "preset">
> = {
  "ai-agents": {
    roomLabel: "The Agent Atrium",
    motto: "Where autonomous products compete for the crown.",
    icon: "◆",
    preset: "obsidianGold",
  },
  "ai-coding": {
    roomLabel: "The Dev Sanctum",
    motto: "Ship faster. Bid harder. Own the terminal.",
    icon: "⌘",
    preset: "midnightSapphire",
  },
  "no-code": {
    roomLabel: "The Builder Salon",
    motto: "Visual creators, visual rankings.",
    icon: "◫",
    preset: "emeraldLounge",
  },
  "browser-extensions": {
    roomLabel: "The Extension Gallery",
    motto: "Small tools. Big bids.",
    icon: "⬡",
    preset: "charcoalPlatinum",
  },
  newsletters: {
    roomLabel: "The Creator Club",
    motto: "Audiences pay attention. Founders pay to rank.",
    icon: "✉",
    preset: "burgundyVelvet",
  },
  "indie-saas": {
    roomLabel: "The Bootstrap Hall",
    motto: "Bootstrapped grit meets premium placement.",
    icon: "▣",
    preset: "obsidianGold",
  },
  "mobile-apps": {
    roomLabel: "The App Lounge",
    motto: "Pocket-sized products. Board-sized ambition.",
    icon: "◉",
    preset: "deepAmethyst",
  },
  "desktop-apps": {
    roomLabel: "The Native Suite",
    motto: "Desktop power. Leaderboard prestige.",
    icon: "▢",
    preset: "charcoalPlatinum",
  },
  design: {
    roomLabel: "The Design Studio",
    motto: "Beautiful products deserve beautiful ranks.",
    icon: "◈",
    preset: "burgundyVelvet",
  },
  marketing: {
    roomLabel: "The Growth Chamber",
    motto: "Rank is the ultimate growth metric.",
    icon: "↗",
    preset: "emeraldLounge",
  },
  ecommerce: {
    roomLabel: "The Commerce Vault",
    motto: "Checkout energy. Crown ambition.",
    icon: "◆",
    preset: "obsidianGold",
  },
  career: {
    roomLabel: "The Career Pavilion",
    motto: "Help people get hired. Get yourself ranked.",
    icon: "◎",
    preset: "midnightSapphire",
  },
  fashion: {
    roomLabel: "The Style Salon",
    motto: "Runway visibility for digital brands.",
    icon: "✦",
    preset: "burgundyVelvet",
  },
  fitness: {
    roomLabel: "The Wellness Wing",
    motto: "Strong products. Stronger positions.",
    icon: "◯",
    preset: "emeraldLounge",
  },
  fintech: {
    roomLabel: "The Capital Room",
    motto: "Money moves markets. Bids move ranks.",
    icon: "$",
    preset: "obsidianGold",
  },
  productivity: {
    roomLabel: "The Focus Library",
    motto: "Organize the world. Organize the board.",
    icon: "☰",
    preset: "charcoalPlatinum",
  },
  writing: {
    roomLabel: "The Author's Study",
    motto: "Words win wars. Bids win rows.",
    icon: "¶",
    preset: "deepAmethyst",
  },
  video: {
    roomLabel: "The Creator Stage",
    motto: "Lights, camera, leaderboard.",
    icon: "▶",
    preset: "burgundyVelvet",
  },
  "open-source": {
    roomLabel: "The Commons Hall",
    motto: "Free code. Paid prominence.",
    icon: "◉",
    preset: "midnightSapphire",
  },
  agencies: {
    roomLabel: "The Partner Lounge",
    motto: "Client work. Crown work.",
    icon: "◫",
    preset: "charcoalPlatinum",
  },
  "local-business": {
    roomLabel: "The City Room",
    motto: "Neighborhood names. National ambition.",
    icon: "⌖",
    preset: "emeraldLounge",
  },
  "trending-lol": {
    roomLabel: "The .lol Observatory",
    motto: "The meta-board for the pay-to-rank wave itself.",
    icon: "👑",
    preset: "obsidianGold",
  },
};

export function getCategoryRoomTheme(slug: string): CategoryRoomTheme | null {
  const cat = LAUNCH_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;

  const meta = ROOM_META[slug] ?? {
    roomLabel: `The ${cat.name} Room`,
    motto: cat.description,
    icon: "◆",
    preset: PRESET_KEYS[LAUNCH_CATEGORIES.indexOf(cat) % PRESET_KEYS.length],
  };

  return {
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    isMeta: "isMeta" in cat ? !!cat.isMeta : false,
    ...meta,
  };
}

export function getPreset(theme: CategoryRoomTheme) {
  return LUXURY_PRESETS[theme.preset];
}
