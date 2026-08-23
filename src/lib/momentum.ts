import { prisma } from "@/lib/db";
import { writePlatformEvent } from "@/lib/platform-events";

const WINDOWS_H = [10, 24] as const;
export async function computeMomentum(limit = 5) {
  const now = Date.now();
  const results: {
    listingId: string;
    displayUrl: string;
    slug: string;
    title: string;
    currentBid: number;
    growthPct24h: number;
    growthPct10h: number;
    bidStart10h: number;
    bidEnd10h: number;
  }[] = [];

  const listings = await prisma.listing.findMany({
    where: { currentBid: { gt: 0 }, status: "active" },
    select: { id: true, displayUrl: true, slug: true, title: true, currentBid: true },
    take: 100,
  });

  for (const listing of listings) {
    const bids = await prisma.bid.findMany({
      where: {
        listingId: listing.id,
        status: "completed",
        completedAt: { gte: new Date(now - WINDOWS_H[1] * 3_600_000) },
      },
      orderBy: { completedAt: "asc" },
      select: { totalAfter: true, completedAt: true },
    });
    if (bids.length < 2) continue;

    const bidRangeAt = (hoursAgo: number) => {
      const cutoff = new Date(now - hoursAgo * 3_600_000);
      const before = bids.filter((b) => b.completedAt && b.completedAt <= cutoff);
      const after = bids.filter((b) => b.completedAt && b.completedAt > cutoff);
      const start = before.at(-1)?.totalAfter ?? bids[0]!.totalAfter;
      const end = after.at(-1)?.totalAfter ?? listing.currentBid;
      return { start, end };
    };

    const bidAt = (hoursAgo: number) => {
      const { start, end } = bidRangeAt(hoursAgo);
      if (start <= 0) return 0;
      return Math.round(((end - start) / start) * 100);
    };

    const range10h = bidRangeAt(WINDOWS_H[0]);
    const growthPct10h = bidAt(WINDOWS_H[0]);
    const growthPct24h = bidAt(WINDOWS_H[1]);
    if (growthPct24h <= 0 && growthPct10h <= 0) continue;

    results.push({
      listingId: listing.id,
      displayUrl: listing.displayUrl,
      slug: listing.slug,
      title: listing.title,
      currentBid: listing.currentBid,
      growthPct10h,
      growthPct24h,
      bidStart10h: range10h.start,
      bidEnd10h: range10h.end,
    });
  }

  results.sort((a, b) => b.growthPct24h - a.growthPct24h || b.growthPct10h - a.growthPct10h);
  return results.slice(0, limit);
}

export async function getBreakoutListings(limit = 5) {
  const rows = await computeMomentum(limit * 2);
  return rows.sort((a, b) => b.growthPct24h - a.growthPct24h).slice(0, limit);
}

export async function getMomentumListings(limit = 5) {
  const rows = await computeMomentum(limit * 2);
  return rows.sort((a, b) => b.growthPct10h - a.growthPct10h).slice(0, limit);
}

/** Cron-only: emit breakout events for movers above threshold. */
export async function emitBreakoutEvents(thresholdPct = 20): Promise<number> {
  const movers = await computeMomentum(10);
  let emitted = 0;
  for (const row of movers) {
    if (row.growthPct24h < thresholdPct) continue;
    const recent = await prisma.platformEvent.findFirst({
      where: {
        eventType: "breakout",
        listingId: row.listingId,
        createdAt: { gte: new Date(Date.now() - 24 * 3_600_000) },
      },
    });
    if (recent) continue;
    await writePlatformEvent({
      eventType: "breakout",
      listingId: row.listingId,
      metadata: { displayUrl: row.displayUrl, growthPct: row.growthPct24h },
    });
    emitted++;
  }
  return emitted;
}
