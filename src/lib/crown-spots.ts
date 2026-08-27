/** KingBid flagship crown — 21 ownable logo spots on the GLB crown mesh. */

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
  /** Hotspot position in GLB space (Y-up, crown ~1 unit wide). */
  position: [number, number, number];
  hotspotScale: number;
}

export const CROWN_SPOT_PREFIX = "kingbid-spot-";

/** Positions tuned to royal-crown.glb bbox (x/z ±0.53, y 0–0.56). */
function pos(angleDeg: number, y: number, r: number): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [Math.sin(rad) * r, y, Math.cos(rad) * r];
}

export const CROWN_SPOTS: CrownSpotDef[] = [
  {
    id: "01",
    slug: "crown-owner",
    categorySlug: "kingbid-spot-01",
    tier: "crown",
    label: "Crown Owner",
    shortLabel: "👑",
    tierLabel: "The King",
    personality: "Top-center emblem on the crown",
    startingBid: 2500,
    position: [0, 0.52, 0.14],
    hotspotScale: 0.055,
  },
  ...diamondSpots(),
  ...royalTriangleSpots(),
  ...courtSpots(),
];

function diamondSpots(): CrownSpotDef[] {
  const angles = [0, 60, 120, 180, 240, 300];
  const labels = ["Front", "Front Right", "Rear Right", "Back", "Rear Left", "Front Left"];
  const prices = [500, 450, 400, 450, 350, 400];
  return angles.map((deg, i) => ({
    id: String(2 + i).padStart(2, "0"),
    slug: `diamond-${String(i + 1).padStart(2, "0")}`,
    categorySlug: `kingbid-spot-${String(2 + i).padStart(2, "0")}`,
    tier: "diamond" as const,
    label: `Diamond ${String(i + 1).padStart(2, "0")} — ${labels[i]}`,
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Premium jewel on the crown band",
    startingBid: prices[i]!,
    position: pos(deg, 0.34, 0.44),
    hotspotScale: 0.042,
  }));
}

function royalTriangleSpots(): CrownSpotDef[] {
  const prices = [250, 230, 220, 200, 190, 180, 170, 150, 130, 110];
  return Array.from({ length: 10 }, (_, i) => {
    const deg = i * 36;
    const y = 0.44 + (i % 2) * 0.04;
    return {
      id: String(8 + i).padStart(2, "0"),
      slug: `royal-${String(i + 1).padStart(2, "0")}`,
      categorySlug: `kingbid-spot-${String(8 + i).padStart(2, "0")}`,
      tier: "royal" as const,
      label: `Royal Panel #${String(i + 1).padStart(2, "0")}`,
      shortLabel: "🔺",
      tierLabel: "The Royal Court",
      personality: "Top triangle panel on the crown",
      startingBid: prices[i]!,
      position: pos(deg, y, 0.3),
      hotspotScale: 0.038,
    };
  });
}

function courtSpots(): CrownSpotDef[] {
  const angles = [30, 110, 190, 270];
  const prices = [90, 70, 50, 25];
  return angles.map((deg, i) => ({
    id: String(18 + i).padStart(2, "0"),
    slug: `court-${String(i + 1).padStart(2, "0")}`,
    categorySlug: `kingbid-spot-${String(18 + i).padStart(2, "0")}`,
    tier: "court" as const,
    label: `Court Spot #${String(i + 1).padStart(2, "0")}`,
    shortLabel: "🔹",
    tierLabel: "The King's Court",
    personality: "Lower band panel for startups",
    startingBid: prices[i]!,
    position: pos(deg, 0.1, 0.5),
    hotspotScale: 0.034,
  }));
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
  { tier: "diamond" as const, label: "💎 Royal Gems", count: 6, range: "$300–$500" },
  { tier: "royal" as const, label: "🔺 Royal Panels", count: 10, range: "$110–$250" },
  { tier: "court" as const, label: "🔹 Court Spots", count: 4, range: "$25–$90" },
];
