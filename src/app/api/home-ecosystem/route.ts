import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBreakoutListings } from "@/lib/momentum";
import { getGlobalBoardId, getCurrentKing, getNextChallenger } from "@/lib/reign";
import { getUnderdogRow } from "@/lib/underdog";
import { getRecentPlatformEvents, eventHeadline } from "@/lib/platform-events";
import { getLeaderboard } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";
import { priceForTopSpot } from "@/lib/pricing";
import { shortCategoryName, getCategoryRoomTheme } from "@/lib/category-rooms";
import { FALLEN_FUND_REVENUE_PCT } from "@/lib/fallen-fund";

export const dynamic = "force-dynamic";

/** Full homepage ecosystem — one payload for the living competitive board. */
export async function GET() {
  const globalBoardId = await getGlobalBoardId();

  const [
    king,
    challenger,
    breakout,
    underdogs,
    events,
    leaderboard,
    categories,
    matchups,
    kingmakers,
    fallenPool,
  ] = await Promise.all([
    getCurrentKing(globalBoardId),
    getCurrentKing(globalBoardId).then((k) => getNextChallenger(globalBoardId, k?.id ?? null)),
    getBreakoutListings(6),
    getUnderdogRow(null, 6),
    getRecentPlatformEvents(12),
    getLeaderboard(1, 8, "global"),
    prisma.category.findMany({
      where: { isMeta: false },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        boards: {
          where: { region: null },
          select: { id: true, listings: { where: { currentBid: { gt: 0 } }, select: { id: true } } },
        },
      },
    }),
    prisma.matchup.findMany({
      where: { status: "active" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        listingA: { select: { slug: true, displayUrl: true, currentBid: true } },
        listingB: { select: { slug: true, displayUrl: true, currentBid: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.kingbidScore.findMany({
      orderBy: { score: "desc" },
      take: 6,
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            email: true,
            discoveryLists: {
              take: 3,
              include: { listing: { select: { displayUrl: true, slug: true } } },
            },
          },
        },
      },
    }),
    prisma.fallenFundPool.findFirst({
      orderBy: { weekStart: "desc" },
      include: {
        grants: {
          take: 5,
          include: { recipient: { select: { displayUrl: true, slug: true } } },
        },
      },
    }),
  ]);

  const gap =
    king && challenger ? Math.max(0, priceForTopSpot(king.currentBid) - challenger.currentBid) : null;

  const rooms = categories.map((c) => {
    const theme = getCategoryRoomTheme(c.slug);
    return {
      slug: c.slug,
      label: shortCategoryName(c.slug, c.name),
      icon: theme?.icon ?? "◆",
      name: c.name,
      listingCount: c.boards[0]?.listings.length ?? 0,
      enterUrl: `/?room=${c.slug}`,
    };
  });

  const featuredSlugs = ["ai-agents", "indie-saas", "ai-coding", "fintech", "open-source", "newsletters"];
  const featuredRooms = featuredSlugs
    .map((slug) => rooms.find((r) => r.slug === slug))
    .filter(Boolean) as typeof rooms;

  return NextResponse.json({
    globalKing: king
      ? {
          ...king,
          gapLabel: gap != null ? `${formatMoney(gap)} to dethrone` : null,
        }
      : null,
    challenger,
    leaderboard: leaderboard.entries.map((e) => ({
      rank: e.rank,
      slug: e.slug,
      displayUrl: e.displayUrl,
      title: e.title,
      currentBid: e.currentBid,
      id: e.id,
    })),
    breakout,
    underdogs,
    momentum: breakout,
    rooms,
    featuredRooms: featuredRooms.length ? featuredRooms : rooms.slice(0, 6),
    liveBattles: matchups.map((m) => ({
      id: m.id,
      listingA: m.listingA,
      listingB: m.listingB,
      votes: m._count.votes,
      url: `/versus/${m.id}`,
    })),
    kingmakers: kingmakers.map((k) => ({
      userId: k.user.id,
      handle: k.user.handle ?? k.user.email?.split("@")[0] ?? "founder",
      score: k.score,
      profileUrl: `/profile/${k.user.id}`,
      picks: k.user.discoveryLists.map((d) => ({
        slug: d.listing.slug,
        displayUrl: d.listing.displayUrl,
      })),
    })),
    fallenFund: fallenPool
      ? {
          weekStart: fallenPool.weekStart.toISOString(),
          poolCents: fallenPool.totalPoolCents,
          pct: Math.round(FALLEN_FUND_REVENUE_PCT * 100),
          status: fallenPool.status,
          grants: fallenPool.grants.map((g) => ({
            displayUrl: g.recipient.displayUrl,
            slug: g.recipient.slug,
            grantType: g.grantType,
          })),
        }
      : { weekStart: null, poolCents: 0, pct: Math.round(FALLEN_FUND_REVENUE_PCT * 100), status: "accruing", grants: [] },
    history: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      headline: eventHeadline(e.eventType, e.metadata),
      at: e.at,
    })),
    minBid: leaderboard.minBid,
  });
}
