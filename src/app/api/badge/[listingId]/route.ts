import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankForListing } from "@/lib/listing-page";
import { canShowOnPublicBoard } from "@/lib/guardrails";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/** Live rank badge SVG — global or room-scoped via ?room=slug */
export async function GET(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const { searchParams } = new URL(request.url);
  const roomSlug = searchParams.get("room");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      displayUrl: true,
      currentBid: true,
      status: true,
      boardId: true,
      board: { select: { category: { select: { name: true, slug: true } } } },
    },
  });

  if (!listing || !canShowOnPublicBoard(listing.status) || listing.currentBid <= 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  let rank = (await getRankForListing(listingId)) ?? 1;
  let roomLabel = "";

  if (roomSlug && listing.board?.category?.slug === roomSlug) {
    roomLabel = listing.board.category.name;
    const inRoom = await prisma.listing.findMany({
      where: { boardId: listing.boardId, currentBid: { gt: 0 }, status: "active" },
      orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
      select: { id: true },
    });
    rank = inRoom.findIndex((l) => l.id === listingId) + 1 || rank;
  }

  const line2 = roomLabel
    ? `#${rank} in ${roomLabel} · $${listing.currentBid.toLocaleString()}`
    : `#${rank} · $${listing.currentBid.toLocaleString()}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48" viewBox="0 0 280 48">
  <rect width="280" height="48" rx="10" fill="#1a1512"/>
  <text x="12" y="20" fill="#e85d3a" font-family="system-ui,sans-serif" font-size="11" font-weight="600">KINGBID</text>
  <text x="12" y="38" fill="#f5f0eb" font-family="system-ui,sans-serif" font-size="13" font-weight="700">${line2}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
