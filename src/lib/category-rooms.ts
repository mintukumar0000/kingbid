// Category room metadata — light premium squares, matches site palette.

import { LAUNCH_CATEGORIES } from "@/lib/categories";

export type CategoryRoomTheme = {
  slug: string;
  name: string;
  description: string;
  roomLabel: string;
  motto: string;
  icon: string;
  isMeta?: boolean;
};

const ROOM_META: Record<
  string,
  Pick<CategoryRoomTheme, "roomLabel" | "motto" | "icon">
> = {
  "ai-agents": {
    roomLabel: "Agent Atrium",
    motto: "Autonomous agents and AI tools — ranked by real bids.",
    icon: "◆",
  },
  "ai-coding": {
    roomLabel: "Dev Sanctum",
    motto: "IDE plugins, copilots, and dev infrastructure.",
    icon: "⌘",
  },
  "no-code": {
    roomLabel: "Builder Salon",
    motto: "Visual builders without writing code.",
    icon: "◫",
  },
  "browser-extensions": {
    roomLabel: "Extension Gallery",
    motto: "Chrome, Firefox, Safari, and Edge extensions.",
    icon: "⬡",
  },
  newsletters: {
    roomLabel: "Creator Club",
    motto: "Newsletters, creators, and paid media brands.",
    icon: "✉",
  },
  "indie-saas": {
    roomLabel: "Bootstrap Hall",
    motto: "Bootstrapped SaaS and micro-products.",
    icon: "▣",
  },
  "mobile-apps": {
    roomLabel: "App Lounge",
    motto: "iOS and Android from indie studios.",
    icon: "◉",
  },
  "desktop-apps": {
    roomLabel: "Native Suite",
    motto: "Mac, Windows, and Linux desktop apps.",
    icon: "▢",
  },
  design: {
    roomLabel: "Design Studio",
    motto: "Design tools, templates, and creative studios.",
    icon: "◈",
  },
  marketing: {
    roomLabel: "Growth Chamber",
    motto: "SEO, ads, analytics, and growth tools.",
    icon: "↗",
  },
  ecommerce: {
    roomLabel: "Commerce Vault",
    motto: "E-commerce, Shopify apps, and marketplaces.",
    icon: "◆",
  },
  career: {
    roomLabel: "Career Pavilion",
    motto: "Job search, résumés, and hiring products.",
    icon: "◎",
  },
  fashion: {
    roomLabel: "Style Salon",
    motto: "Fashion, retail, and try-on tech.",
    icon: "✦",
  },
  fitness: {
    roomLabel: "Wellness Wing",
    motto: "Fitness, nutrition, and health apps.",
    icon: "◯",
  },
  fintech: {
    roomLabel: "Capital Room",
    motto: "Personal finance, investing, and B2B fintech.",
    icon: "$",
  },
  productivity: {
    roomLabel: "Focus Library",
    motto: "Tasks, notes, and personal OS tools.",
    icon: "☰",
  },
  writing: {
    roomLabel: "Author's Study",
    motto: "Writing assistants and content workflows.",
    icon: "¶",
  },
  video: {
    roomLabel: "Creator Stage",
    motto: "Video editing, streaming, and creator tools.",
    icon: "▶",
  },
  "open-source": {
    roomLabel: "Commons Hall",
    motto: "Open-source libraries and dev tools.",
    icon: "◉",
  },
  agencies: {
    roomLabel: "Partner Lounge",
    motto: "Freelancers, agencies, and service studios.",
    icon: "◫",
  },
  "local-business": {
    roomLabel: "City Room",
    motto: "Local and regional businesses by city.",
    icon: "⌖",
  },
  "trending-lol": {
    roomLabel: ".lol Observatory",
    motto: "Pay-to-rank micro-sites and viral .lol projects.",
    icon: "👑",
  },
};

export function getCategoryRoomTheme(slug: string): CategoryRoomTheme | null {
  const cat = LAUNCH_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;

  const meta = ROOM_META[slug] ?? {
    roomLabel: cat.name,
    motto: cat.description,
    icon: "◆",
  };

  return {
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    isMeta: "isMeta" in cat ? !!cat.isMeta : false,
    ...meta,
  };
}

export function shortCategoryName(name: string): string {
  return name;
}
