import { prisma } from "@/lib/db";

import { REF_COOKIE } from "@/lib/brand";

export { REF_COOKIE };

/** Resolve a referral slug to a listing id (must have completed at least one bid). */
export async function resolveReferralSlug(slug: string | null | undefined): Promise<string | null> {
  if (!slug?.trim()) return null;
  const listing = await prisma.listing.findFirst({
    where: { slug: slug.trim().toLowerCase(), currentBid: { gt: 0 } },
    select: { id: true },
  });
  return listing?.id ?? null;
}

export function referralCookieName(): string {
  return REF_COOKIE;
}

/** Award $1 credit to referrer when a referred bid completes. */
export async function grantReferralCredit(referralListingId: string, bidderListingId: string): Promise<void> {
  if (referralListingId === bidderListingId) return;
  await prisma.listing.update({
    where: { id: referralListingId },
    data: { creditBalance: { increment: 1 } },
  });
}
