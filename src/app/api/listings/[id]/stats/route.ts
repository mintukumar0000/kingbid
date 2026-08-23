import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canShowOnPublicBoard } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

/** Public click stats for a listing — real DB counts only. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      displayUrl: true,
      title: true,
      clickCount: true,
      currentBid: true,
      status: true,
      createdAt: true,
    },
  });

  if (!listing || !canShowOnPublicBoard(listing.status)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const clicks = await prisma.click.findMany({
    where: { listingId: id, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const c of clicks) {
    const day = c.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const timeline = [...byDay.entries()].map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    listing: {
      id: listing.id,
      slug: listing.slug,
      displayUrl: listing.displayUrl,
      title: listing.title,
      currentBid: listing.currentBid,
      clickCount: listing.clickCount,
    },
    timeline,
    totalClicks: listing.clickCount,
  });
}
