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
    position: [0, 0.54, 0.1],
    hotspotScale: 0.055,
  },
  ...diamondSpots(),
  ...royalTriangleSpots(),
  ...courtSpots(),
];

function diamondSpots(): CrownSpotDef[] {
  const configs = [
    { deg: 0, y: 0.27, r: 0.5, label: "Front", price: 500 },
    { deg: 58, y: 0.25, r: 0.5, label: "Front Right", price: 450 },
    { deg: 118, y: 0.24, r: 0.49, label: "Rear Right", price: 400 },
    { deg: 180, y: 0.26, r: 0.48, label: "Back", price: 450 },
    { deg: 238, y: 0.24, r: 0.49, label: "Rear Left", price: 350 },
    { deg: 302, y: 0.25, r: 0.5, label: "Front Left", price: 400 },
  ];
  return configs.map((c, i) => ({
    id: String(2 + i).padStart(2, "0"),
    slug: `diamond-${String(i + 1).padStart(2, "0")}`,
    categorySlug: `kingbid-spot-${String(2 + i).padStart(2, "0")}`,
    tier: "diamond" as const,
    label: `Diamond ${String(i + 1).padStart(2, "0")} — ${c.label}`,
    shortLabel: "💎",
    tierLabel: "Royal Gem",
    personality: "Premium jewel on the crown band",
    startingBid: c.price,
    position: pos(c.deg, c.y, c.r),
    hotspotScale: 0.042,
  }));
}

function royalTriangleSpots(): CrownSpotDef[] {
  const configs = [
    { deg: 0, y: 0.54, r: 0.1 },
    { deg: 36, y: 0.51, r: 0.26 },
    { deg: 72, y: 0.48, r: 0.4 },
    { deg: 108, y: 0.46, r: 0.48 },
    { deg: 144, y: 0.48, r: 0.4 },
    { deg: 180, y: 0.51, r: 0.26 },
    { deg: 216, y: 0.46, r: 0.48 },
    { deg: 252, y: 0.48, r: 0.4 },
    { deg: 288, y: 0.46, r: 0.48 },
    { deg: 324, y: 0.51, r: 0.26 },
  ];
  const prices = [250, 230, 220, 200, 190, 180, 170, 150, 130, 110];
  return configs.map((c, i) => ({
    id: String(8 + i).padStart(2, "0"),
    slug: `royal-${String(i + 1).padStart(2, "0")}`,
    categorySlug: `kingbid-spot-${String(8 + i).padStart(2, "0")}`,
    tier: "royal" as const,
    label: `Royal Panel #${String(i + 1).padStart(2, "0")}`,
    shortLabel: "🔺",
    tierLabel: "The Royal Court",
    personality: "Top triangle panel on the crown",
    startingBid: prices[i]!,
    position: pos(c.deg, c.y, c.r),
    hotspotScale: 0.038,
  }));
}

function courtSpots(): CrownSpotDef[] {
  const configs = [
    { deg: 20, y: 0.12, r: 0.52 },
    { deg: 110, y: 0.1, r: 0.51 },
    { deg: 200, y: 0.11, r: 0.5 },
    { deg: 290, y: 0.1, r: 0.51 },
  ];
  const prices = [90, 70, 50, 25];
  return configs.map((c, i) => ({
    id: String(18 + i).padStart(2, "0"),
    slug: `court-${String(i + 1).padStart(2, "0")}`,
    categorySlug: `kingbid-spot-${String(18 + i).padStart(2, "0")}`,
    tier: "court" as const,
    label: `Court Spot #${String(i + 1).padStart(2, "0")}`,
    shortLabel: "🔹",
    tierLabel: "The King's Court",
    personality: "Lower band panel for startups",
    startingBid: prices[i]!,
    position: pos(c.deg, c.y, c.r),
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
