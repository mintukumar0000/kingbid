import { prisma } from "@/lib/db";
import { getLaunchedAt } from "@/lib/meta";

export interface AboutPageStats {
  launchedAt: Date;
  totalVisitors: number;
  totalRevenue: number;
  totalListings: number;
  totalBids: number;
  topListing: { displayUrl: string; slug: string; currentBid: number } | null;
}

export async function getAboutPageStats(): Promise<AboutPageStats> {
  const [launchedAt, totalVisitors, revenueAgg, totalListings, totalBids, topListing] =
    await Promise.all([
      getLaunchedAt(),
      prisma.visitor.count(),
      prisma.bid.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      prisma.listing.count({ where: { currentBid: { gt: 0 } } }),
      prisma.bid.count({ where: { status: "completed" } }),
      prisma.listing.findFirst({
        where: { currentBid: { gt: 0 } },
        orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
        select: { displayUrl: true, slug: true, currentBid: true },
      }),
    ]);

  return {
    launchedAt,
    totalVisitors,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    totalListings,
    totalBids,
    topListing,
  };
}
