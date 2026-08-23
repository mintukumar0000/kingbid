// Shared leaderboard query used by both the server-rendered homepage and the
// /api/listings polling endpoint.

import { prisma } from "@/lib/db";
import { countryDisplayName, type BoardScope } from "@/lib/geo";
import { isTakeoverActive, priceForRank, priceForTopSpot, takeoverPrice, MIN_BID } from "@/lib/pricing";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  slug: string;
  url: string;
  displayUrl: string;
  kind: string;
  handle: string | null;
  title: string;
  description: string;
  currentBid: number;
  creditBalance: number;
  clickCount: number;
  clicksPerHour: number;
  claimPrice: number;
  lastBidAt: string;
  takeoverActive: boolean;
  takeoverUntil: string | null;
  countryCode: string | null;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  bidSnapshot: { currentBid: number; lastBidAt: string }[];
  total: number;
  page: number;
  pageSize: number;
  topBid: number;
  claimTopPrice: number;
  takeoverPrice: number;
  takeoverActiveUntil: string | null;
  minBid: number;
  scope: BoardScope;
  countryCode: string | null;
  countryName: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
}

function bidForScope(
  l: { currentBid: number; localBid: number; lastBidAt: Date; localLastBidAt: Date | null },
  scope: BoardScope
): { amount: number; lastBidAt: Date } {
  if (scope === "local") {
    return { amount: l.localBid, lastBidAt: l.localLastBidAt ?? l.lastBidAt };
  }
  return { amount: l.currentBid, lastBidAt: l.lastBidAt };
}

export async function getLeaderboard(
  page = 1,
  pageSize = 50,
  scope: BoardScope = "global",
  countryCode?: string | null,
  categorySlug?: string | null
): Promise<LeaderboardData> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  if (categorySlug) {
    const { getBoardIdForCategorySlug } = await import("@/lib/boards");
    const boardId = await getBoardIdForCategorySlug(categorySlug);
    if (!boardId) {
      return {
        entries: [],
        bidSnapshot: [],
        total: 0,
        page,
        pageSize,
        topBid: 0,
        claimTopPrice: MIN_BID,
        takeoverPrice: 0,
        takeoverActiveUntil: null,
        minBid: MIN_BID,
        scope: "global",
        countryCode: null,
        countryName: null,
        categorySlug,
        categoryName: null,
      };
    }

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { name: true },
    });

    const where = { boardId, currentBid: { gt: 0 }, status: "active" as const };
    const orderBy = [
      { currentBid: "desc" as const },
      { lastBidAt: "asc" as const },
      { createdAt: "asc" as const },
    ] as const;

    const [listings, total, hourClicks] = await Promise.all([
      prisma.listing.findMany({ where, orderBy: [...orderBy] }),
      prisma.listing.count({ where }),
      prisma.click.groupBy({
        by: ["listingId"],
        where: { createdAt: { gte: oneHourAgo }, listing: { boardId } },
        _count: { _all: true },
      }),
    ]);

    const clicksByListing = new Map(hourClicks.map((c) => [c.listingId, c._count._all]));
    const topBid = listings[0]?.currentBid ?? 0;
    const start = (page - 1) * pageSize;

    const entries: LeaderboardEntry[] = listings.slice(start, start + pageSize).map((l, i) => {
      const rank = start + i + 1;
      return {
        id: l.id,
        rank,
        slug: l.slug,
        url: l.url,
        displayUrl: l.displayUrl,
        kind: l.kind,
        handle: l.handle,
        title: l.title,
        description: l.description,
        currentBid: l.currentBid,
        creditBalance: l.creditBalance,
        clickCount: l.clickCount,
        clicksPerHour: clicksByListing.get(l.id) ?? 0,
        claimPrice: priceForRank(rank, l.currentBid, topBid),
        lastBidAt: l.lastBidAt.toISOString(),
        takeoverActive: false,
        takeoverUntil: null,
        countryCode: l.countryCode,
      };
    });

    return {
      entries,
      bidSnapshot: listings.map((l) => ({
        currentBid: l.currentBid,
        lastBidAt: l.lastBidAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      topBid,
      claimTopPrice: priceForTopSpot(topBid),
      takeoverPrice: takeoverPrice(topBid),
      takeoverActiveUntil: null,
      minBid: MIN_BID,
      scope: "global",
      countryCode: null,
      countryName: null,
      categorySlug,
      categoryName: category?.name ?? null,
    };
  }

  const isLocal = scope === "local" && !!countryCode;

  const where = isLocal
    ? { countryCode: countryCode!, localBid: { gt: 0 }, status: "active" }
    : { currentBid: { gt: 0 }, status: "active" };

  const orderBy = isLocal
    ? ([
        { localBid: "desc" as const },
        { localLastBidAt: "asc" as const },
        { createdAt: "asc" as const },
      ] as const)
    : ([
        { currentBid: "desc" as const },
        { lastBidAt: "asc" as const },
        { createdAt: "asc" as const },
      ] as const);

  const [listings, total, hourClicks] = await Promise.all([
    prisma.listing.findMany({ where, orderBy: [...orderBy] }),
    prisma.listing.count({ where }),
    prisma.click.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: oneHourAgo } },
      _count: { _all: true },
    }),
  ]);

  const clicksByListing = new Map(hourClicks.map((c) => [c.listingId, c._count._all]));

  const activeTakeover = !isLocal ? listings.find((l) => isTakeoverActive(l, now)) : undefined;
  const ordered = activeTakeover
    ? [activeTakeover, ...listings.filter((l) => l.id !== activeTakeover.id)]
    : listings;

  const topBid = ordered[0] ? bidForScope(ordered[0], scope).amount : 0;
  const start = (page - 1) * pageSize;

  const entries: LeaderboardEntry[] = ordered.slice(start, start + pageSize).map((l, i) => {
    const rank = start + i + 1;
    const { amount, lastBidAt } = bidForScope(l, scope);
    return {
      id: l.id,
      rank,
      slug: l.slug,
      url: l.url,
      displayUrl: l.displayUrl,
      kind: l.kind,
      handle: l.handle,
      title: l.title,
      description: l.description,
      currentBid: amount,
      creditBalance: l.creditBalance,
      clickCount: l.clickCount,
      clicksPerHour: clicksByListing.get(l.id) ?? 0,
      claimPrice: priceForRank(rank, amount, topBid),
      lastBidAt: lastBidAt.toISOString(),
      takeoverActive: !isLocal && isTakeoverActive(l, now),
      takeoverUntil: l.takeoverUntil?.toISOString() ?? null,
      countryCode: l.countryCode,
    };
  });

  return {
    entries,
    bidSnapshot: ordered.map((l) => {
      const { amount, lastBidAt } = bidForScope(l, scope);
      return { currentBid: amount, lastBidAt: lastBidAt.toISOString() };
    }),
    total,
    page,
    pageSize,
    topBid,
    claimTopPrice: priceForTopSpot(topBid),
    takeoverPrice: takeoverPrice(topBid),
    takeoverActiveUntil: activeTakeover?.takeoverUntil?.toISOString() ?? null,
    minBid: MIN_BID,
    scope,
    countryCode: isLocal ? countryCode! : null,
    countryName: isLocal ? countryDisplayName(countryCode!) : null,
  };
}
