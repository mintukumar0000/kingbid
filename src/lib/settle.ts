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
import { getGlobalBoardId, recordReignChange } from "@/lib/reign";
import { writePlatformEvent } from "@/lib/platform-events";
import { recomputeUnderdogForListing } from "@/lib/underdog";
import { emitRivalGapEvents } from "@/lib/rivals-feed";
import { recordCampaignPayment } from "@/lib/nepal-campaign";

async function handleTopSpotChange(
  boardId: string,
  listingId: string,
  scope: "global" | "category"
): Promise<boolean> {
  const top = await prisma.listing.findFirst({
    where:
      scope === "category"
        ? { boardId, currentBid: { gt: 0 }, status: "active" }
        : { currentBid: { gt: 0 }, status: "active" },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
    select: { id: true },
  });
  if (!top || top.id !== listingId) return false;

  const openReign = await prisma.reignHistory.findFirst({
    where: { boardId, endedAt: null, rank: 1 },
    select: { listingId: true },
  });
  const previousTopId =
    openReign && openReign.listingId !== listingId ? openReign.listingId : null;

  await recordReignChange(boardId, listingId, previousTopId);
  return scope === "global";
}

export async function settlePayment(paymentId: string): Promise<void> {
  const result = await confirmBid(paymentId);
  if (!result) return;

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: {
      listing: {
        select: {
          displayUrl: true,
          slug: true,
          boardId: true,
          currentBid: true,
          revenueBand: true,
        },
      },
    },
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

    if (result.newTotal > 0) {
      const priorBids = await prisma.bid.count({
        where: { listingId: result.listingId, status: "completed" },
      });
      if (priorBids === 1) {
        await writePlatformEvent({
          eventType: "new_founder",
          boardId: bid.listing.boardId,
          listingId: result.listingId,
          metadata: {
            displayUrl: bid.listing.displayUrl,
            slug: bid.listing.slug,
            bid: result.newTotal,
          },
        });
      }
    }

    if (bid.listing.revenueBand) {
      await recomputeUnderdogForListing(result.listingId, bid.listing.boardId);
    }

    await emitRivalGapEvents(result.listingId, result.newTotal);

    await recordCampaignPayment(paymentId).catch(() => undefined);
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
      result.newTotal,
      result.outbidListingDisplayUrl ?? undefined
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

  if (result.tookTopSpot && bid) {
    const globalBoardId = await getGlobalBoardId();
    const categoryBoardId = bid.listing.boardId;

    if (bid.scope === "global") {
      const isGlobalKing = await handleTopSpotChange(globalBoardId, result.listingId, "global");
      if (isGlobalKing && bid.listing.displayUrl) {
        await tweetTopSpotChange(bid.listing.displayUrl, result.newTotal);
      }
    }

    if (categoryBoardId && categoryBoardId !== globalBoardId) {
      const catTop = await prisma.listing.findFirst({
        where: { boardId: categoryBoardId, currentBid: { gt: 0 } },
        orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
        select: { id: true },
      });
      if (catTop?.id === result.listingId) {
        await handleTopSpotChange(categoryBoardId, result.listingId, "category");
      }
    }
  }
}
