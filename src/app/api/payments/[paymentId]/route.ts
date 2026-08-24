import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRankForListing } from "@/lib/listing-page";
import { syncPaymentFromDodo } from "@/lib/dodo-sync";

export const dynamic = "force-dynamic";

async function paymentPayload(paymentId: string) {
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

  if (!bid) return null;

  if (bid.status !== "completed") {
    return {
      status: bid.status,
      amount: bid.amount,
      listingTitle: bid.listing.title,
      displayUrl: bid.listing.displayUrl,
      slug: bid.listing.slug,
    };
  }

  const rank = await getRankForListing(bid.listingId);

  return {
    status: "completed" as const,
    paymentId,
    amount: bid.amount,
    creditApplied: bid.creditApplied,
    totalAfter: bid.totalAfter,
    listingTitle: bid.listing.title,
    displayUrl: bid.listing.displayUrl,
    slug: bid.listing.slug,
    rank,
    isTakeover: bid.isTakeover,
  };
}

/** Public payment status for success page (completed bids only). */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const payload = await paymentPayload(paymentId);
  if (!payload) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }
  return NextResponse.json(payload);
}

/** Poll fallback — verify with Dodo API when webhook hasn't arrived yet. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  let dodoPaymentId: string | undefined;
  try {
    const body = (await request.json()) as { dodoPaymentId?: string };
    dodoPaymentId = body.dodoPaymentId;
  } catch {
    /* no body */
  }

  if (dodoPaymentId) {
    await syncPaymentFromDodo(paymentId, dodoPaymentId);
  }

  const payload = await paymentPayload(paymentId);
  if (!payload) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }
  return NextResponse.json(payload);
}
