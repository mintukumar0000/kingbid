import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Latest completed bids for the live activity feed.
export async function GET() {
  const bids = await prisma.bid.findMany({
    where: { status: "completed" },
    orderBy: { completedAt: "desc" },
    take: 20,
    include: {
      listing: { select: { id: true, title: true, displayUrl: true, url: true } },
    },
  });

  // Compute the rank each listing currently holds
  const listings = await prisma.listing.findMany({
    where: { currentBid: { gt: 0 } },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const rankById = new Map(listings.map((l, i) => [l.id, i + 1]));

  const activity = bids.map((b) => ({
    id: b.id,
    listingId: b.listing.id,
    title: b.listing.title,
    displayUrl: b.listing.displayUrl,
    url: b.listing.url,
    amount: b.amount,
    totalAfter: b.totalAfter,
    isTakeover: b.isTakeover,
    rank: rankById.get(b.listing.id) ?? null,
    at: (b.completedAt ?? b.createdAt).toISOString(),
  }));

  return NextResponse.json({ activity });
}
