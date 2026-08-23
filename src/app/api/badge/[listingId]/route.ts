import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankForListing } from "@/lib/listing-page";
import { canShowOnPublicBoard } from "@/lib/guardrails";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/** Live rank badge SVG — cache 5 min at CDN via Cache-Control. */
export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { displayUrl: true, currentBid: true, status: true },
  });

  if (!listing || !canShowOnPublicBoard(listing.status) || listing.currentBid <= 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rank = (await getRankForListing(listingId)) ?? 1;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 220 48">
  <rect width="220" height="48" rx="10" fill="#1a1512"/>
  <text x="12" y="20" fill="#e85d3a" font-family="system-ui,sans-serif" font-size="11" font-weight="600">KINGBID</text>
  <text x="12" y="38" fill="#f5f0eb" font-family="system-ui,sans-serif" font-size="14" font-weight="700">#${rank} · $${listing.currentBid.toLocaleString()}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
