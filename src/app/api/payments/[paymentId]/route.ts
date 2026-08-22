import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankForListing } from "@/lib/listing-page";

export const dynamic = "force-dynamic";

/** Public payment status for success page (completed bids only). */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: {
      listing: {
        select: {
          title: true,
          displayUrl: true,
          slug: true,
          currentBid: true,
        },
      },
    },
  });

  if (!bid) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (bid.status !== "completed") {
    return NextResponse.json({
      status: bid.status,
      amount: bid.amount,
      listingTitle: bid.listing.title,
      displayUrl: bid.listing.displayUrl,
      slug: bid.listing.slug,
    });
  }

  const rank = await getRankForListing(bid.listingId);

  return NextResponse.json({
    status: "completed",
    paymentId,
    amount: bid.amount,
    creditApplied: bid.creditApplied,
    totalAfter: bid.totalAfter,
    listingTitle: bid.listing.title,
    displayUrl: bid.listing.displayUrl,
    slug: bid.listing.slug,
    rank,
    isTakeover: bid.isTakeover,
  });
}
