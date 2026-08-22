import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/rate-limit";
import { liveConnectionCount } from "@/lib/events";
import { getLaunchedAt } from "@/lib/meta";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const ipHash = hashIp(getClientIp(request));
  const now = new Date();

  await prisma.visitor.upsert({
    where: { ipHash },
    create: { ipHash, lastSeen: now },
    update: { lastSeen: now },
  });

  const launchedAt = await getLaunchedAt();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    recentVisitors,
    totalVisitors,
    totalBids,
    revenueAgg,
    totalClicks,
    totalListings,
    hourBids,
    hourRevenue,
    recentHourBids,
  ] = await Promise.all([
    prisma.visitor.count({ where: { lastSeen: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } } }),
    prisma.visitor.count(),
    prisma.bid.count({ where: { status: "completed" } }),
    prisma.bid.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    prisma.listing.aggregate({ _sum: { clickCount: true } }),
    prisma.listing.count({ where: { currentBid: { gt: 0 } } }),
    prisma.bid.count({ where: { status: "completed", completedAt: { gte: oneHourAgo } } }),
    prisma.bid.aggregate({
      where: { status: "completed", completedAt: { gte: oneHourAgo } },
      _sum: { amount: true },
    }),
    prisma.bid.findMany({
      where: { status: "completed", completedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      select: { amount: true, completedAt: true },
    }),
  ]);

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const start = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const slice = recentHourBids.filter(
      (b) => b.completedAt && b.completedAt >= start && b.completedAt < end
    );
    return {
      hour: start.toISOString(),
      bids: slice.length,
      revenue: slice.reduce((s, b) => s + b.amount, 0),
    };
  });

  // Online = whoever is on the SSE stream right now, or recently heartbeated.
  const online = Math.max(liveConnectionCount(), recentVisitors);

  return NextResponse.json({
    online,
    totalVisitors,
    totalBids,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    totalClicks: totalClicks._sum.clickCount ?? 0,
    totalListings,
    launchedAt: launchedAt.toISOString(),
    hoursSinceLaunch: Math.max(0, Math.round((now.getTime() - launchedAt.getTime()) / 3_600_000)),
    bidsLastHour: hourBids,
    revenueLastHour: hourRevenue._sum.amount ?? 0,
    hourly,
  });
}
