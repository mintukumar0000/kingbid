import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBreakoutListings, getMomentumListings } from "@/lib/momentum";
import { getGlobalBoardId, getCurrentKing, getNextChallenger, reignDuration } from "@/lib/reign";
import { getUnderdogRow } from "@/lib/underdog";
import { getRecentPlatformEvents, eventHeadline } from "@/lib/platform-events";
import { getLeaderboard } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";
import { priceForTopSpot } from "@/lib/pricing";
import { shortCategoryName, getCategoryRoomTheme } from "@/lib/category-rooms";
import { FALLEN_FUND_REVENUE_PCT } from "@/lib/fallen-fund";

export const dynamic = "force-dynamic";

function eventIcon(eventType: string): string {
  switch (eventType) {
    case "dethronement":
    case "new_reign":
      return "👑";
    case "comeback":
      return "🔁";
    case "milestone_reign":
      return "🏆";
    case "breakout":
      return "🚀";
    case "new_founder":
      return "✨";
    case "kingmaker_called_it":
      return "🎯";
    default:
      return "📜";
  }
}

function tickerFromEvent(
  eventType: string,
  headline: string,
  metadata: Record<string, unknown>
): string {
  const name = (metadata.displayUrl as string) ?? "A listing";
  switch (eventType) {
    case "dethronement":
      return `👑 <b>${name}</b> lost #1 · ${headline.split(" to ").pop() ?? "new challenger"}`;
    case "breakout":
      return `🚀 <b>${name}</b> is breaking out · +${metadata.growthPct ?? 0}% momentum`;
    case "comeback":
      return `🔁 <b>${name}</b> reclaimed the crown`;
    case "milestone_reign":
      return `🏆 <b>${name}</b> · ${metadata.duration ?? "record reign"}`;
    case "new_founder":
      return `✨ <b>${name}</b> joined the kingdom`;
    default:
      return `📜 ${headline}`;
  }
}

/** Full homepage ecosystem — one payload for the living competitive board. */
export async function GET() {
  const globalBoardId = await getGlobalBoardId();

  const [
    king,
    challenger,
    breakout,
    momentum,
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
    getMomentumListings(6),
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

  const kingExtra = king
    ? await prisma.listing.findUnique({
        where: { id: king.id },
        select: { clickCount: true },
      })
    : null;

  const kingReign = king ? await reignDuration(king.id, globalBoardId) : null;

  const gap =
    king && challenger ? Math.max(0, priceForTopSpot(king.currentBid) - challenger.currentBid) : null;

  const rooms = categories.map((c) => {
    const theme = getCategoryRoomTheme(c.slug);
    return {
      slug: c.slug,
      label: shortCategoryName(c.slug, c.name),
      icon: theme?.icon ?? "◆",
      name: c.name,
      roomLabel: theme?.roomLabel ?? c.name,
      listingCount: c.boards[0]?.listings.length ?? 0,
      enterUrl: `/?room=${c.slug}`,
    };
  });

  const featuredSlugs = ["ai-agents", "indie-saas", "ai-coding", "fintech", "open-source", "newsletters"];
  const featuredRooms = featuredSlugs
    .map((slug) => rooms.find((r) => r.slug === slug))
    .filter(Boolean) as typeof rooms;

  const ticker =
    events.length > 0
      ? events.map((e) => ({
          id: e.id,
          html: tickerFromEvent(e.eventType, eventHeadline(e.eventType, e.metadata), e.metadata),
        }))
      : [
          {
            id: "empty-1",
            html: "👑 <b>KingBid</b> — founding #1 is open · compete for attention",
          },
        ];

  return NextResponse.json({
    globalKing: king
      ? {
          ...king,
          clickCount: kingExtra?.clickCount ?? 0,
          reignLabel: kingReign ? `held for ${kingReign}` : null,
          gapCents: gap,
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
    momentum,
    rooms,
    totalRooms: rooms.length,
    featuredRooms: featuredRooms.length ? featuredRooms : rooms.slice(0, 6),
    liveBattles: matchups.map((m) => {
      const aHigher = m.listingA.currentBid >= m.listingB.currentBid;
      const kingSide = aHigher ? m.listingA : m.listingB;
      const opp = aHigher ? m.listingB : m.listingA;
      const battleGap = Math.max(0, kingSide.currentBid - opp.currentBid);
      return {
        id: m.id,
        king: kingSide,
        challenger: opp,
        gapCents: battleGap,
        votes: m._count.votes,
        url: `/versus/${m.id}`,
      };
    }),
    kingmakers: kingmakers.map((k) => ({
      userId: k.user.id,
      handle: k.user.handle ?? k.user.email?.split("@")[0] ?? "founder",
      score: k.score,
      pickCount: k.user.discoveryLists.length,
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
      : {
          weekStart: null,
          poolCents: 0,
          pct: Math.round(FALLEN_FUND_REVENUE_PCT * 100),
          status: "accruing",
          grants: [],
        },
    history: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      icon: eventIcon(e.eventType),
      headline: eventHeadline(e.eventType, e.metadata),
      at: e.at,
    })),
    ticker,
    minBid: leaderboard.minBid,
  });
}
