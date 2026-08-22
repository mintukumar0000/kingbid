import { prisma } from "@/lib/db";
import { isTakeoverActive } from "@/lib/pricing";

export interface ListingDetail {
  id: string;
  slug: string;
  url: string;
  displayUrl: string;
  kind: string;
  handle: string | null;
  title: string;
  description: string;
  currentBid: number;
  clickCount: number;
  rank: number;
  claimPrice: number;
  topBid: number;
  lastBidAt: string;
  takeoverActive: boolean;
}

export interface RankHistoryPoint {
  at: string;
  totalAfter: number;
  rankEstimate: number;
}

export async function getListingBySlug(slug: string): Promise<ListingDetail | null> {
  const listing = await prisma.listing.findFirst({
    where: { slug: slug.toLowerCase(), currentBid: { gt: 0 } },
  });
  if (!listing) return null;

  const all = await prisma.listing.findMany({
    where: { currentBid: { gt: 0 } },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
  });

  const now = new Date();
  const activeTakeover = all.find((l) => isTakeoverActive(l, now));
  const ordered = activeTakeover
    ? [activeTakeover, ...all.filter((l) => l.id !== activeTakeover.id)]
    : all;

  const rank = ordered.findIndex((l) => l.id === listing.id) + 1;
  const topBid = ordered[0]?.currentBid ?? 0;
  const bidAtRank = ordered[rank - 1]?.currentBid ?? listing.currentBid;
  const claimPrice = rank === 1 ? topBid + 5 : bidAtRank + 1;

  return {
    id: listing.id,
    slug: listing.slug,
    url: listing.url,
    displayUrl: listing.displayUrl,
    kind: listing.kind,
    handle: listing.handle,
    title: listing.title,
    description: listing.description,
    currentBid: listing.currentBid,
    clickCount: listing.clickCount,
    rank,
    claimPrice,
    topBid,
    lastBidAt: listing.lastBidAt.toISOString(),
    takeoverActive: isTakeoverActive(listing, now),
  };
}

/** Bid total over time for the rank history chart. */
export async function getRankHistory(listingId: string): Promise<RankHistoryPoint[]> {
  const bids = await prisma.bid.findMany({
    where: { listingId, status: "completed" },
    orderBy: { completedAt: "asc" },
    select: { totalAfter: true, completedAt: true, bidIncrease: true, amount: true, creditApplied: true },
  });

  return bids.map((b, i) => ({
    at: (b.completedAt ?? new Date()).toISOString(),
    totalAfter: b.totalAfter,
    rankEstimate: i + 1, // simplified; true rank needs full board snapshot
  }));
}

export async function getRankForListing(listingId: string): Promise<number | null> {
  const all = await prisma.listing.findMany({
    where: { currentBid: { gt: 0 } },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, takeoverUntil: true },
  });
  const now = new Date();
  const activeTakeover = all.find((l) => l.takeoverUntil && l.takeoverUntil > now);
  const ordered = activeTakeover
    ? [activeTakeover, ...all.filter((l) => l.id !== activeTakeover.id)]
    : all;
  const idx = ordered.findIndex((l) => l.id === listingId);
  return idx >= 0 ? idx + 1 : null;
}
