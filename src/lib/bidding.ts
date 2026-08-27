// Bidding engine.
//
// Two phases, because "a completed payment is what claims the rank":
//   1. createBidIntent()  - validates everything, creates a PENDING bid row,
//                           returns what the checkout should charge.
//   2. confirmBid()       - called from the payment webhook. Applies the paid
//                           amount to the listing inside a serialized
//                           transaction (row lock on Postgres).

import { prisma } from "@/lib/db";
import {
  MAX_BID,
  MIN_BID,
  MIN_RAISE,
  TAKEOVER_HOURS,
  TOP_SPOT_INCREMENT,
  isTakeoverActive,
  takeoverPrice,
  validateAmount,
} from "@/lib/pricing";
import { cleanTarget, UrlPolicyError } from "@/lib/url-cleaner";
import { slugFromDisplayUrl, uniqueSlug } from "@/lib/slug";
import { countryDisplayName, type BoardScope } from "@/lib/geo";
import { assertConsentedListing } from "@/lib/guardrails";
import { getSpotByCategorySlug, nextBidForSpot } from "@/lib/crown-spots";

const IS_POSTGRES = (process.env.DATABASE_URL ?? "").startsWith("postgres");

function activeBid(
  listing: { currentBid: number; localBid: number },
  scope: BoardScope
): number {
  return scope === "local" ? listing.localBid : listing.currentBid;
}

async function getTopListing(
  scope: BoardScope,
  countryCode?: string | null,
  boardId?: string | null
) {
  if (boardId) {
    return prisma.listing.findFirst({
      where: { boardId, currentBid: { gt: 0 }, status: "active" },
      orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
    });
  }
  if (scope === "local" && countryCode) {
    return prisma.listing.findFirst({
      where: { countryCode, localBid: { gt: 0 } },
      orderBy: [{ localBid: "desc" }, { localLastBidAt: "asc" }, { createdAt: "asc" }],
    });
  }
  return prisma.listing.findFirst({
    where: { currentBid: { gt: 0 } },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
  });
}

export class BidError extends Error {}

export interface BidIntentInput {
  rawUrl: string;
  amount: number;
  title?: string;
  description?: string;
  email?: string;
  isTakeover?: boolean;
  referralListingId?: string | null;
  scope?: BoardScope;
  countryCode?: string | null;
  boardId?: string | null;
  categorySlug?: string | null;
  revenueBand?: string | null;
}

export interface BidIntent {
  bidId: string;
  paymentId: string;
  amount: number; // charged at checkout
  creditApplied: number;
  bidIncrease: number;
  listingUrl: string;
  displayUrl: string;
  isNewListing: boolean;
  totalAfterEstimate: number;
}


export async function createBidIntent(input: BidIntentInput): Promise<BidIntent> {
  assertConsentedListing("owner_submit");
  const scope: BoardScope = input.scope ?? "global";
  const countryCode = input.countryCode ?? null;

  if (scope === "local") {
    if (!countryCode) throw new BidError("Could not detect your country for a local bid.");
    if (input.isTakeover) throw new BidError("Takeovers are only available on the global board.");
  }

  const amountError = validateAmount(input.amount);
  if (amountError) throw new BidError(amountError);

  let target;
  try {
    target = await cleanTarget(input.rawUrl);
  } catch (e) {
    if (e instanceof UrlPolicyError) throw new BidError(e.message);
    throw e;
  }

  const existing = await prisma.listing.findUnique({ where: { url: target.url } });
  const top = await getTopListing(scope, countryCode, input.boardId);
  const topBid = top ? activeBid(top, scope) : 0;
  const existingBid = existing ? activeBid(existing, scope) : 0;
  const isRaise = existing !== null && existingBid > 0;

  if (
    scope === "local" &&
    existing?.countryCode &&
    existing.countryCode !== countryCode
  ) {
    throw new BidError(
      `This listing is on the ${countryDisplayName(existing.countryCode)} board. Switch to Global or bid from that region.`
    );
  }

  if (scope === "global" && top && isTakeoverActive(top) && !input.isTakeover) {
    const wouldTakeTop = existingBid + input.amount > topBid;
    if (wouldTakeTop && existing?.id !== top.id) {
      throw new BidError(
        `#1 is locked by a takeover until ${top.takeoverUntil!.toISOString()}. You can still bid — you'll take #1 the moment the lock expires.`
      );
    }
  }

  if (input.isTakeover) {
    const required = takeoverPrice(topBid);
    if (input.amount < required) {
      throw new BidError(`A takeover costs 5x the current top bid: $${required.toLocaleString()}.`);
    }
    if (top && isTakeoverActive(top)) {
      throw new BidError("A takeover is already active. Try again after it expires.");
    }
  } else if (isRaise) {
    if (input.amount < MIN_RAISE) {
      throw new BidError(`Raising your bid requires paying at least $${MIN_RAISE} more.`);
    }
    const newTotal = existingBid + input.amount;
    if (newTotal > MAX_BID) throw new BidError(`Total bid cannot exceed $${MAX_BID.toLocaleString()}.`);
    if (existing.id !== top?.id && newTotal > topBid && newTotal < topBid + TOP_SPOT_INCREMENT) {
      throw new BidError(
        `Taking #1 requires at least $${TOP_SPOT_INCREMENT} more than the current top bid ` +
          `($${(topBid + TOP_SPOT_INCREMENT).toLocaleString()} total). Pay $${(
            topBid + TOP_SPOT_INCREMENT - existingBid
          ).toLocaleString()} or less than $${(topBid - existingBid).toLocaleString()}.`
      );
    }
  } else {
    const spot = input.categorySlug ? getSpotByCategorySlug(input.categorySlug) : undefined;
    const spotMin = spot ? nextBidForSpot(spot, topBid) : MIN_BID;
    if (input.amount < spotMin) {
      throw new BidError(
        spot
          ? `This spot requires at least $${spotMin.toLocaleString()}.`
          : `New listings start at $${MIN_BID}.`
      );
    }
    if (!spot && input.amount < MIN_BID) throw new BidError(`New listings start at $${MIN_BID}.`);
    if (input.amount > topBid && input.amount < topBid + TOP_SPOT_INCREMENT) {
      throw new BidError(
        `Taking #1 requires at least $${TOP_SPOT_INCREMENT} more than the current top bid ` +
          `($${(topBid + TOP_SPOT_INCREMENT).toLocaleString()}).`
      );
    }
    if (!input.title?.trim()) throw new BidError("A title is required for new listings.");
  }

  const paymentId = `pay_${crypto.randomUUID().replace(/-/g, "")}`;

  // Referral credits auto-apply on raises (not takeovers / new listings)
  let chargeAmount = input.amount;
  let creditApplied = 0;
  if (isRaise && existing && !input.isTakeover && existing.creditBalance > 0) {
    creditApplied = Math.min(existing.creditBalance, Math.max(0, input.amount - MIN_RAISE));
    chargeAmount = input.amount - creditApplied;
  }
  const bidIncrease = input.isTakeover ? input.amount : input.amount;

  const bid = await prisma.$transaction(async (tx) => {
    let listing = await tx.listing.findUnique({ where: { url: target.url } });
    if (!listing) {
      const baseSlug = slugFromDisplayUrl(target.displayUrl, target.handle);
      const slug = await uniqueSlug(baseSlug, async (s) => !!(await tx.listing.findUnique({ where: { slug: s } })));
      listing = await tx.listing.create({
        data: {
          url: target.url,
          slug,
          displayUrl: target.displayUrl,
          kind: target.kind,
          handle: target.handle,
          title: input.title?.trim() || target.displayUrl,
          description: input.description?.trim() ?? "",
          ownerEmail: input.email?.trim() || null,
          ownerContact: input.email?.trim() || null,
          boardId: input.boardId ?? null,
          revenueBand: input.revenueBand ?? null,
          status: "active",
          claimedAt: new Date(),
          currentBid: 0, // hidden until first payment completes
        },
      });
    } else if (input.revenueBand && !listing.revenueBand) {
      listing = await tx.listing.update({
        where: { id: listing.id },
        data: { revenueBand: input.revenueBand },
      });
    }

    // Claiming from a category room assigns the listing to that room's board.
    if (input.boardId) {
      if (listing.boardId && listing.boardId !== input.boardId) {
        throw new BidError(
          "This product is already listed in another room. Open that room to raise your bid."
        );
      }
      if (!listing.boardId) {
        listing = await tx.listing.update({
          where: { id: listing.id },
          data: { boardId: input.boardId },
        });
      }
    }
    return tx.bid.create({
      data: {
        listingId: listing.id,
        amount: chargeAmount,
        creditApplied,
        bidIncrease,
        paymentId,
        status: "pending",
        isTakeover: input.isTakeover ?? false,
        email: input.email?.trim() || null,
        referralListingId: input.referralListingId ?? null,
        scope,
        countryCode: scope === "local" ? countryCode : null,
      },
    });
  });

  return {
    bidId: bid.id,
    paymentId,
    amount: chargeAmount,
    creditApplied,
    bidIncrease,
    listingUrl: target.url,
    displayUrl: target.displayUrl,
    isNewListing: !isRaise,
    totalAfterEstimate: existingBid + bidIncrease,
  };
}

export interface ConfirmResult {
  listingId: string;
  listingTitle: string;
  listingUrl: string;
  listingSlug: string;
  newTotal: number;
  becameTop: boolean;
  tookTopSpot: boolean;
  previousTopListingId: string | null;
  outbidOwnerEmail: string | null;
  outbidListingTitle: string | null;
  outbidListingSlug: string | null;
  outbidListingDisplayUrl: string | null;
  referralListingId: string | null;
  referralOwnerEmail: string | null;
}

// In-process queue so concurrent webhook deliveries never open parallel
// write transactions (SQLite is single-writer; on Postgres this simply
// reduces lock contention — the FOR UPDATE row lock is the real guarantee).
let confirmQueue: Promise<unknown> = Promise.resolve();

/**
 * Applies a completed payment. Idempotent (webhooks may retry).
 * Confirmations are serialized in-process, and on Postgres the listing row
 * is additionally locked with SELECT ... FOR UPDATE to prevent
 * concurrent-bid race conditions across instances.
 */
export function confirmBid(paymentId: string): Promise<ConfirmResult | null> {
  const run = confirmQueue.then(() => applyConfirmedBid(paymentId));
  confirmQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function applyConfirmedBid(paymentId: string): Promise<ConfirmResult | null> {
  return prisma.$transaction(
    async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { paymentId },
        include: { listing: true },
      });
      if (!bid) return null;
      if (bid.status === "completed") {
        return {
          listingId: bid.listingId,
          listingTitle: bid.listing.title,
          listingUrl: bid.listing.url,
          listingSlug: bid.listing.slug,
          newTotal: bid.totalAfter,
          becameTop: false,
          tookTopSpot: false,
          previousTopListingId: null,
          outbidOwnerEmail: null,
          outbidListingTitle: null,
          outbidListingSlug: null,
          outbidListingDisplayUrl: null,
          referralListingId: bid.referralListingId,
          referralOwnerEmail: null,
        };
      }

      if (IS_POSTGRES) {
        // Row-level lock so concurrent webhook deliveries serialize here.
        await tx.$queryRaw`SELECT id FROM listings WHERE id = ${bid.listingId} FOR UPDATE`;
      }

      const previousTop =
        bid.scope === "local" && bid.countryCode
          ? await tx.listing.findFirst({
              where: { countryCode: bid.countryCode, localBid: { gt: 0 } },
              orderBy: [{ localBid: "desc" }, { localLastBidAt: "asc" }, { createdAt: "asc" }],
            })
          : await tx.listing.findFirst({
              where: { currentBid: { gt: 0 } },
              orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
            });

      const listing = await tx.listing.findUniqueOrThrow({ where: { id: bid.listingId } });
      const increase = bid.bidIncrease > 0 ? bid.bidIncrease : bid.amount + bid.creditApplied;
      const isLocal = bid.scope === "local";
      const prior = isLocal ? listing.localBid : listing.currentBid;
      const newTotal = Math.min(prior + increase, MAX_BID);
      const now = new Date();
      const takeoverEnd =
        !isLocal && bid.isTakeover
          ? new Date(now.getTime() + TAKEOVER_HOURS * 60 * 60 * 1000)
          : null;

      await tx.listing.update({
        where: { id: listing.id },
        data: {
          ...(isLocal
            ? {
                localBid: newTotal,
                localLastBidAt: now,
                countryCode: bid.countryCode ?? listing.countryCode,
              }
            : {
                currentBid: newTotal,
                lastBidAt: now,
                ...(takeoverEnd ? { takeoverUntil: takeoverEnd } : {}),
              }),
          ...(bid.email ? { ownerEmail: bid.email } : {}),
          ...(bid.creditApplied > 0
            ? { creditBalance: { decrement: bid.creditApplied } }
            : {}),
        },
      });

      await tx.bid.update({
        where: { id: bid.id },
        data: { status: "completed", completedAt: now, totalAfter: newTotal, takeoverEnd },
      });

      await tx.analytics.create({
        data: {
          event: "bid",
          listingId: listing.id,
          metadata: JSON.stringify({
            amount: bid.amount,
            creditApplied: bid.creditApplied,
            totalAfter: newTotal,
            isTakeover: bid.isTakeover,
            scope: bid.scope,
            countryCode: bid.countryCode,
          }),
        },
      });

      const prevTopBid = previousTop
        ? isLocal
          ? previousTop.localBid
          : previousTop.currentBid
        : 0;

      const tookTopSpot =
        !!takeoverEnd ||
        !previousTop ||
        previousTop.id === listing.id ||
        newTotal > prevTopBid;

      if (tookTopSpot && previousTop && previousTop.id !== listing.id && !isLocal) {
        await tx.analytics.create({
          data: {
            event: "lost_top",
            listingId: previousTop.id,
            metadata: JSON.stringify({
              displayUrl: previousTop.displayUrl,
              slug: previousTop.slug,
              newTop: listing.displayUrl,
            }),
          },
        });
      }

      let referralOwnerEmail: string | null = null;
      if (bid.referralListingId && bid.referralListingId !== listing.id) {
        const referrer = await tx.listing.update({
          where: { id: bid.referralListingId },
          data: { creditBalance: { increment: 1 } },
          select: { ownerEmail: true, creditBalance: true },
        });
        referralOwnerEmail = referrer.ownerEmail;
      }

      return {
        listingId: listing.id,
        listingTitle: listing.title,
        listingUrl: listing.url,
        listingSlug: listing.slug,
        newTotal,
        becameTop: tookTopSpot,
        tookTopSpot:
          tookTopSpot && !!previousTop && previousTop.id !== listing.id,
        previousTopListingId:
          previousTop && previousTop.id !== listing.id ? previousTop.id : null,
        outbidOwnerEmail:
          tookTopSpot && previousTop && previousTop.id !== listing.id
            ? previousTop.ownerEmail
            : null,
        outbidListingTitle:
          tookTopSpot && previousTop && previousTop.id !== listing.id
            ? previousTop.title
            : null,
        outbidListingSlug:
          tookTopSpot && previousTop && previousTop.id !== listing.id
            ? previousTop.slug
            : null,
        outbidListingDisplayUrl:
          tookTopSpot && previousTop && previousTop.id !== listing.id
            ? previousTop.displayUrl
            : null,
        referralListingId: bid.referralListingId,
        referralOwnerEmail,
      };
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
}

export async function failBid(paymentId: string): Promise<void> {
  await prisma.bid.updateMany({
    where: { paymentId, status: "pending" },
    data: { status: "failed" },
  });
}
