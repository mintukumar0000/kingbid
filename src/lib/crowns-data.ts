import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/leaderboard";
import { getBoardIdForCategorySlug, getGlobalBoardId } from "@/lib/boards";
import { priceForTopSpot, MIN_BID } from "@/lib/pricing";
import { CROWNS, type CrownDefinition, type CrownGroup } from "@/lib/crowns";

export interface CrownState {
  slug: string;
  name: string;
  headline: string;
  group: CrownGroup;
  theme: CrownDefinition["theme"];
  flag?: string;
  description: string;
  disclaimer?: string;
  hasKing: boolean;
  kingHandle: string | null;
  kingDisplayUrl: string | null;
  kingUrl: string | null;
  kingListingId: string | null;
  kingSlug: string | null;
  kingTitle: string | null;
  kingDescription: string | null;
  clickCount: number;
  currentBid: number;
  nextBid: number;
  bidCount: number;
  watchers: number;
  lastBidAt: string | null;
  previousKing: { handle: string; bid: number } | null;
  bidDeltaToday: number;
  isHot: boolean;
  isNewKing: boolean;
}

export interface DethronementFeedItem {
  crownSlug: string;
  crownName: string;
  previousKing: string;
  newKing: string;
  previousBid: number;
  newBid: number;
  at: string;
}

async function bidCountForBoard(boardId: string | null, countryCode?: string): Promise<number> {
  if (countryCode) {
    return prisma.bid.count({
      where: { status: "completed", countryCode, scope: "local" },
    });
  }
  if (boardId) {
    return prisma.bid.count({
      where: { status: "completed", listing: { boardId } },
    });
  }
  return prisma.bid.count({ where: { status: "completed", scope: "global" } });
}

async function bidDeltaToday(boardId: string | null, countryCode?: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const where = countryCode
    ? { status: "completed" as const, createdAt: { gte: since }, countryCode, scope: "local" as const }
    : boardId
      ? { status: "completed" as const, createdAt: { gte: since }, listing: { boardId } }
      : { status: "completed" as const, createdAt: { gte: since }, scope: "global" as const };
  const agg = await prisma.bid.aggregate({ where, _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}

function kingLabel(entry: { handle: string | null; displayUrl: string } | undefined): string | null {
  if (!entry) return null;
  if (entry.handle) return entry.handle.startsWith("@") ? entry.handle : `@${entry.handle}`;
  return entry.displayUrl;
}

export async function getCrownState(crown: CrownDefinition): Promise<CrownState> {
  const scope = crown.scope === "local" ? "local" : "global";
  const countryCode = crown.countryCode ?? null;
  const categorySlug = crown.categorySlug;

  const board = await getLeaderboard(1, 1, scope, countryCode, categorySlug ?? undefined);
  const king = board.entries[0];
  const challenger = board.entries[1];

  let boardId: string | null = null;
  if (crown.scope === "global") boardId = await getGlobalBoardId();
  else if (categorySlug) boardId = await getBoardIdForCategorySlug(categorySlug);

  const [bidCount, bidDeltaTodayAmount] = await Promise.all([
    bidCountForBoard(boardId, countryCode ?? undefined),
    bidDeltaToday(boardId, countryCode ?? undefined),
  ]);

  const watchers = king?.clicksPerHour ?? king?.clickCount ?? 0;
  let recentDethrone: {
    listing: { handle: string | null; displayUrl: string; currentBid: number };
    occurredAt: Date;
  } | null = null;
  if (boardId) {
    recentDethrone = await prisma.dethronement.findFirst({
      where: { boardId },
      orderBy: { occurredAt: "desc" },
      include: {
        listing: { select: { displayUrl: true, handle: true, currentBid: true } },
      },
    });
  }

  const isNewKing =
    !!recentDethrone && Date.now() - recentDethrone.occurredAt.getTime() < 15 * 60_000;

  return {
    slug: crown.slug,
    name: crown.name,
    headline: crown.headline,
    group: crown.group,
    theme: crown.theme,
    flag: crown.flag,
    description: crown.description,
    disclaimer: crown.disclaimer,
    hasKing: !!king,
    kingHandle: kingLabel(king),
    kingDisplayUrl: king?.displayUrl ?? null,
    kingUrl: king?.url ?? null,
    kingListingId: king?.id ?? null,
    kingSlug: king?.slug ?? null,
    kingTitle: king?.title ?? null,
    kingDescription: king?.description || null,
    clickCount: king?.clickCount ?? 0,
    currentBid: king?.currentBid ?? 0,
    nextBid: king ? board.claimTopPrice : MIN_BID,
    bidCount,
    watchers: Math.max(watchers, bidCount > 0 ? Math.min(bidCount * 3, 99) : 0),
    lastBidAt: king?.lastBidAt ?? null,
    previousKing: recentDethrone
      ? {
          handle: kingLabel(recentDethrone.listing) ?? recentDethrone.listing.displayUrl,
          bid: recentDethrone.listing.currentBid,
        }
      : challenger
        ? { handle: kingLabel(challenger) ?? challenger.displayUrl, bid: challenger.currentBid }
        : null,
    bidDeltaToday: bidDeltaTodayAmount,
    isHot: watchers >= 10 || bidDeltaTodayAmount >= 100,
    isNewKing,
  };
}

export async function getAllCrowns(filter?: CrownGroup | "trending"): Promise<CrownState[]> {
  let list = CROWNS;
  if (filter && filter !== "trending") {
    list = CROWNS.filter((c) => c.group === filter);
  }
  const states = await Promise.all(list.map(getCrownState));
  if (filter === "trending") {
    return [...states].sort((a, b) => b.bidDeltaToday - a.bidDeltaToday);
  }
  return states;
}

export async function getCrownHistory(crown: CrownDefinition, limit = 10) {
  let boardId: string | null = null;
  if (crown.scope === "global") boardId = await getGlobalBoardId();
  else if (crown.categorySlug) boardId = await getBoardIdForCategorySlug(crown.categorySlug);
  else if (crown.scope === "local" && crown.countryCode) {
    const top = await getLeaderboard(1, limit, "local", crown.countryCode);
    return top.entries.map((e, i) => ({
      rank: i + 1,
      handle: kingLabel(e) ?? e.displayUrl,
      bid: e.currentBid,
      at: e.lastBidAt,
      isCurrent: i === 0,
    }));
  }

  if (!boardId) return [];

  const reigns = await prisma.reignHistory.findMany({
    where: { boardId, rank: 1 },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      listing: { select: { displayUrl: true, handle: true, currentBid: true } },
    },
  });

  return reigns.map((r, i) => ({
    rank: i + 1,
    handle: kingLabel(r.listing) ?? r.listing.displayUrl,
    bid: r.listing.currentBid,
    at: r.startedAt.toISOString(),
    isCurrent: i === 0 && !r.endedAt,
  }));
}

export async function getRecentDethronements(limit = 5): Promise<DethronementFeedItem[]> {
  const rows = await prisma.dethronement.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      listing: { select: { displayUrl: true, handle: true, currentBid: true } },
      dethronedBy: { select: { displayUrl: true, handle: true, currentBid: true } },
      board: { include: { category: { select: { slug: true, name: true } } } },
    },
  });

  return rows.map((d) => {
    const crownSlug =
      d.board.category?.slug ??
      (d.board.categoryId ? "unknown" : "king-of-the-internet");
    const crownDef = CROWNS.find((c) => c.categorySlug === crownSlug || (c.scope === "global" && !d.board.categoryId));
    return {
      crownSlug: crownDef?.slug ?? crownSlug,
      crownName: crownDef?.name ?? d.board.category?.name ?? "Crown",
      previousKing: kingLabel(d.listing) ?? d.listing.displayUrl,
      newKing: kingLabel(d.dethronedBy) ?? d.dethronedBy.displayUrl,
      previousBid: d.listing.currentBid,
      newBid: d.dethronedBy.currentBid,
      at: d.occurredAt.toISOString(),
    };
  });
}

export function formatNextBid(currentBid: number): number {
  return currentBid > 0 ? priceForTopSpot(currentBid) : MIN_BID;
}
