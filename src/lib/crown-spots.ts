/** KingBid flagship crown — 21 ownable logo spots on one 3D object. */

export type SpotTier = "crown" | "diamond" | "royal" | "court";

export interface CrownSpotDef {
  id: string;
  slug: string;
  categorySlug: string;
  tier: SpotTier;
  label: string;
  shortLabel: string;
  tierLabel: string;
  personality: string;
  startingBid: number;
  /** Hotspot position on the crown (meters, Y-up). */
  position: [number, number, number];
  hotspotScale: number;
}

export const CROWN_SPOT_PREFIX = "kingbid-spot-";

export const CROWN_SPOTS: CrownSpotDef[] = [
  {
    id: "01",
    slug: "crown-owner",
    categorySlug: "kingbid-spot-01",
    tier: "crown",
    label: "Crown Owner",
    shortLabel: "👑",
    tierLabel: "The King",
    personality: "Own the KingBid Crown",
    startingBid: 2500,
    position: [0, 1.05, 0],
    hotspotScale: 0.14,
  },
  {
    id: "02",
    slug: "diamond-front",
    categorySlug: "kingbid-spot-02",
    tier: "diamond",
    label: "Diamond 01 — Front",
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Front-facing premium jewel",
    startingBid: 500,
    position: [0, 0.72, 0.52],
    hotspotScale: 0.11,
  },
  {
    id: "03",
    slug: "diamond-left",
    categorySlug: "kingbid-spot-03",
    tier: "diamond",
    label: "Diamond 02 — Left",
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Left-side premium jewel",
    startingBid: 400,
    position: [-0.52, 0.65, 0.08],
    hotspotScale: 0.1,
  },
  {
    id: "04",
    slug: "diamond-right",
    categorySlug: "kingbid-spot-04",
    tier: "diamond",
    label: "Diamond 03 — Right",
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Right-side premium jewel",
    startingBid: 400,
    position: [0.52, 0.65, 0.08],
    hotspotScale: 0.1,
  },
  {
    id: "05",
    slug: "diamond-back",
    categorySlug: "kingbid-spot-05",
    tier: "diamond",
    label: "Diamond 04 — Back",
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Rear premium jewel",
    startingBid: 300,
    position: [0, 0.62, -0.5],
    hotspotScale: 0.1,
  },
  ...royalPanels(),
  ...courtSpots(),
];

function royalPanels(): CrownSpotDef[] {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const prices = [220, 200, 180, 160, 150, 140, 120, 100];
  return angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const r = 0.62;
    const y = 0.38 + (i % 2) * 0.06;
    return {
      id: String(6 + i).padStart(2, "0"),
      slug: `royal-${String(i + 1).padStart(2, "0")}`,
      categorySlug: `kingbid-spot-${String(6 + i).padStart(2, "0")}`,
      tier: "royal" as const,
      label: `Royal Panel #${String(i + 1).padStart(2, "0")}`,
      shortLabel: "🔺",
      tierLabel: "The Royal Court",
      personality: "Large logo panel on the crown",
      startingBid: prices[i]!,
      position: [Math.sin(rad) * r, y, Math.cos(rad) * r] as [number, number, number],
      hotspotScale: 0.09,
    };
  });
}

function courtSpots(): CrownSpotDef[] {
  const angles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const prices = [90, 80, 70, 60, 50, 40, 30, 25];
  return angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const r = 0.78;
    return {
      id: String(14 + i).padStart(2, "0"),
      slug: `court-${String(i + 1).padStart(2, "0")}`,
      categorySlug: `kingbid-spot-${String(14 + i).padStart(2, "0")}`,
      tier: "court" as const,
      label: `Court Spot #${String(i + 1).padStart(2, "0")}`,
      shortLabel: "🔹",
      tierLabel: "The King's Court",
      personality: "Accessible court panel for startups",
      startingBid: prices[i]!,
      position: [Math.sin(rad) * r, 0.12, Math.cos(rad) * r] as [number, number, number],
      hotspotScale: 0.075,
    };
  });
}

export function getSpotByCategorySlug(slug: string): CrownSpotDef | undefined {
  return CROWN_SPOTS.find((s) => s.categorySlug === slug);
}

export function getSpotById(id: string): CrownSpotDef | undefined {
  return CROWN_SPOTS.find((s) => s.id === id);
}

export function isCrownSpotCategory(slug: string | null | undefined): boolean {
  return !!slug?.startsWith(CROWN_SPOT_PREFIX);
}

export function nextBidForSpot(spot: CrownSpotDef, currentBid: number): number {
  if (currentBid <= 0) return spot.startingBid;
  return currentBid + 5;
}

export const TIER_SUMMARY = [
  { tier: "crown" as const, label: "👑 Crown", count: 1, range: "$2,500" },
  { tier: "diamond" as const, label: "💎 Royal Gems", count: 4, range: "$300–$500" },
  { tier: "royal" as const, label: "🔺 Royal Panels", count: 8, range: "$100–$250" },
  { tier: "court" as const, label: "🔹 Court Spots", count: 8, range: "$25–$100" },
];
