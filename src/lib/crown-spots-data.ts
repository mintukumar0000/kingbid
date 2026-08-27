import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/leaderboard";
import { getBoardIdForCategorySlug } from "@/lib/boards";
import { CROWN_SPOTS, nextBidForSpot, type CrownSpotDef } from "@/lib/crown-spots";

export interface CrownSpotState {
  id: string;
  slug: string;
  categorySlug: string;
  tier: CrownSpotDef["tier"];
  label: string;
  shortLabel: string;
  tierLabel: string;
  personality: string;
  startingBid: number;
  position: [number, number, number];
  hotspotScale: number;
  hasOwner: boolean;
  ownerHandle: string | null;
  ownerTitle: string | null;
  ownerUrl: string | null;
  ownerLogo: string | null;
  currentBid: number;
  nextBid: number;
  bidCount: number;
  watchers: number;
}

async function spotState(def: CrownSpotDef): Promise<CrownSpotState> {
  const boardId = await getBoardIdForCategorySlug(def.categorySlug);
  let king = null;
  let bidCount = 0;

  if (boardId) {
    const board = await getLeaderboard(1, 1, "global", null, def.categorySlug);
    king = board.entries[0] ?? null;
    bidCount = await prisma.bid.count({
      where: { status: "completed", listing: { boardId } },
    });
  }

  const currentBid = king?.currentBid ?? 0;

  return {
    id: def.id,
    slug: def.slug,
    categorySlug: def.categorySlug,
    tier: def.tier,
    label: def.label,
    shortLabel: def.shortLabel,
    tierLabel: def.tierLabel,
    personality: def.personality,
    startingBid: def.startingBid,
    position: def.position,
    hotspotScale: def.hotspotScale,
    hasOwner: !!king,
    ownerHandle: king?.handle ?? null,
    ownerTitle: king?.title ?? null,
    ownerUrl: king?.url ?? null,
    ownerLogo: king?.url ?? null,
    currentBid,
    nextBid: nextBidForSpot(def, currentBid),
    bidCount,
    watchers: 0,
  };
}

export async function getAllCrownSpotStates(): Promise<CrownSpotState[]> {
  return Promise.all(CROWN_SPOTS.map(spotState));
}

export async function getCrownSpotStats(spots: CrownSpotState[]) {
  const totalValue = spots.filter((s) => s.hasOwner).reduce((sum, s) => sum + s.currentBid, 0);
  const claimed = spots.filter((s) => s.hasOwner).length;
  return { totalValue, claimed, total: spots.length };
}
