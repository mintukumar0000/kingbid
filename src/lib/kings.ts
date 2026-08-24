import { prisma } from "@/lib/db";
import { getGlobalBoardId, getCurrentKing } from "@/lib/reign";
import { getUnderdogRow } from "@/lib/underdog";
import { getBreakoutListings, getMomentumListings } from "@/lib/momentum";

export type KingCard = {
  kind: "money" | "sacrifice" | "breakout" | "traction" | "community";
  emoji: string;
  title: string;
  slug: string;
  displayUrl: string;
  stat: string;
  statLabel: string;
  href: string;
};

/** Five kings for homepage Row of Kings. */
export async function getRowOfKings(): Promise<KingCard[]> {
  const globalBoardId = await getGlobalBoardId();

  const [moneyKing, underdogs, breakouts, momentum, topClicks] = await Promise.all([
    getCurrentKing(globalBoardId),
    getUnderdogRow(null, 1),
    getBreakoutListings(1),
    getMomentumListings(1),
    prisma.listing.findFirst({
      where: { currentBid: { gt: 0 }, status: "active" },
      orderBy: { clickCount: "desc" },
      select: { slug: true, displayUrl: true, clickCount: true },
    }),
  ]);

  const kings: KingCard[] = [];

  if (moneyKing) {
    kings.push({
      kind: "money",
      emoji: "👑",
      title: "Money King",
      slug: moneyKing.slug,
      displayUrl: moneyKing.displayUrl,
      stat: `$${moneyKing.currentBid.toLocaleString("en-US")}`,
      statLabel: "Highest bid",
      href: `/l/${moneyKing.slug}`,
    });
  }

  const sacrifice = underdogs[0];
  if (sacrifice) {
    kings.push({
      kind: "sacrifice",
      emoji: "🔥",
      title: "Sacrifice King",
      slug: sacrifice.slug,
      displayUrl: sacrifice.displayUrl,
      stat: `${sacrifice.sacrificeScore.toFixed(1)}×`,
      statLabel: "Conviction",
      href: `/l/${sacrifice.slug}`,
    });
  }

  const breakout = breakouts[0];
  if (breakout) {
    kings.push({
      kind: "breakout",
      emoji: "⚡",
      title: "Breakout King",
      slug: breakout.slug,
      displayUrl: breakout.displayUrl,
      stat: `+${breakout.growthPct24h}%`,
      statLabel: "24h rise",
      href: `/l/${breakout.slug}`,
    });
  }

  const tract = momentum[0];
  if (tract) {
    kings.push({
      kind: "traction",
      emoji: "🚀",
      title: "Traction King",
      slug: tract.slug,
      displayUrl: tract.displayUrl,
      stat: `+${tract.growthPct10h}%`,
      statLabel: "10h momentum",
      href: `/l/${tract.slug}`,
    });
  }

  if (topClicks) {
    kings.push({
      kind: "community",
      emoji: "❤️",
      title: "Community King",
      slug: topClicks.slug,
      displayUrl: topClicks.displayUrl,
      stat: topClicks.clickCount.toLocaleString(),
      statLabel: "Clicks",
      href: `/l/${topClicks.slug}`,
    });
  }

  return kings;
}
