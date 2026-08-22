import { confirmBid } from "@/lib/bidding";
import {
  sendBidConfirmation,
  sendOutbidAlert,
  sendReferralCreditEarned,
} from "@/lib/email";
import { prisma } from "@/lib/db";
import { emitLive } from "@/lib/events";
import { getRankForListing } from "@/lib/listing-page";
import { priceForTopSpot } from "@/lib/pricing";
import { tweetTopSpotChange } from "@/lib/twitter";

export async function settlePayment(paymentId: string): Promise<void> {
  const result = await confirmBid(paymentId);
  if (!result) return;

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: { select: { displayUrl: true, slug: true } } },
  });

  if (bid) {
    emitLive({
      type: "bid",
      listingId: result.listingId,
      displayUrl: bid.listing.displayUrl,
      title: result.listingTitle,
      amount: bid.amount,
      totalAfter: result.newTotal,
      isTakeover: bid.isTakeover,
      at: new Date().toISOString(),
    });
  }

  const rank = await getRankForListing(result.listingId);

  if (bid?.email) {
    await sendBidConfirmation(bid.email, result.listingTitle, bid.amount, result.newTotal, {
      rank,
      slug: result.listingSlug,
      paymentId,
    });
  }

  if (result.outbidOwnerEmail && result.outbidListingTitle && result.outbidListingSlug) {
    const claimPrice = priceForTopSpot(result.newTotal);
    await sendOutbidAlert(
      result.outbidOwnerEmail,
      result.outbidListingTitle,
      result.outbidListingSlug,
      claimPrice,
      result.newTotal
    );
  }

  if (result.referralOwnerEmail && result.referralListingId) {
    const referrer = await prisma.listing.findUnique({
      where: { id: result.referralListingId },
      select: { title: true, creditBalance: true },
    });
    if (referrer) {
      await sendReferralCreditEarned(
        result.referralOwnerEmail,
        referrer.title,
        referrer.creditBalance
      );
    }
  }

  if (result.tookTopSpot && bid?.scope === "global" && bid.listing.displayUrl) {
    await tweetTopSpotChange(bid.listing.displayUrl, result.newTotal);
  }
}
