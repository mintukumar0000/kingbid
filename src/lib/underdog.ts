import { prisma } from "@/lib/db";
import type { RevenueBand } from "@/lib/revenue-bands";
import { REVENUE_BAND_MIDPOINT } from "@/lib/revenue-bands";

/** sacrifice_score = bid ÷ midpoint of revenue band, normalized per room. */
export function rawSacrificeScore(bidDollars: number, band: RevenueBand): number {
  const mid = REVENUE_BAND_MIDPOINT[band];
  if (mid <= 0) return bidDollars > 0 ? bidDollars : 0;
  return bidDollars / mid;
}

export async function recomputeUnderdogForListing(
  listingId: string,
  boardId: string | null
): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { currentBid: true, revenueBand: true, boardId: true },
  });
  if (!listing?.revenueBand || listing.currentBid <= 0) return;

  const band = listing.revenueBand as RevenueBand;
  const raw = rawSacrificeScore(listing.currentBid, band);

  const peers = await prisma.listing.findMany({
    where: {
      boardId: boardId ?? listing.boardId ?? undefined,
      currentBid: { gt: 0 },
      revenueBand: { not: null },
      status: "active",
    },
    select: { id: true, currentBid: true, revenueBand: true },
  });

  const rawScores = peers.map((p) =>
    rawSacrificeScore(p.currentBid, p.revenueBand as RevenueBand)
  );
  const maxRaw = Math.max(1, ...rawScores);
  const normalized = raw / maxRaw;

  await prisma.underdogScore.create({
    data: {
      listingId,
      boardId: boardId ?? listing.boardId,
      bidAmountCents: listing.currentBid * 100,
      revenueBand: band,
      sacrificeScore: normalized,
    },
  });
}

export async function getUnderdogRow(boardId: string | null, limit = 10) {
  const latest = await prisma.underdogScore.findMany({
    where: boardId ? { boardId } : {},
    orderBy: [{ sacrificeScore: "desc" }, { computedAt: "desc" }],
    take: limit * 3,
    include: {
      listing: {
        select: {
          id: true,
          slug: true,
          displayUrl: true,
          title: true,
          currentBid: true,
          revenueBand: true,
          boardId: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const out: typeof latest = [];
  for (const row of latest) {
    if (seen.has(row.listingId)) continue;
    seen.add(row.listingId);
    out.push(row);
    if (out.length >= limit) break;
  }

  const listingIds = out.map((r) => r.listingId);
  const verified = listingIds.length
    ? await prisma.verification.findMany({
        where: {
          listingId: { in: listingIds },
          verificationType: "revenue_band",
          verifiedAt: { not: null },
        },
        select: { listingId: true, revenueBand: true },
      })
    : [];
  const verifiedSet = new Set(verified.map((v) => v.listingId));

  return out.map((row) => ({
    listingId: row.listingId,
    slug: row.listing.slug,
    displayUrl: row.listing.displayUrl,
    title: row.listing.title,
    currentBid: row.listing.currentBid,
    revenueBand: row.revenueBand,
    revenueVerified: verifiedSet.has(row.listingId),
    sacrificeScore: row.sacrificeScore,
  }));
}
