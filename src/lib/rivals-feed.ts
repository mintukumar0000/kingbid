import { prisma } from "@/lib/db";
import { writePlatformEvent } from "@/lib/platform-events";

/** After a bid completes, emit feed events when tracked rivals are passed or close. */
export async function emitRivalGapEvents(listingId: string, newBid: number): Promise<void> {
  const rivals = await prisma.rival.findMany({
    where: { listingId },
    include: {
      listing: { select: { displayUrl: true, slug: true, currentBid: true } },
      rivalListing: { select: { displayUrl: true, slug: true, currentBid: true } },
    },
  });

  for (const row of rivals) {
    const gap = newBid - row.rivalListing.currentBid;
    const gapLabel =
      gap >= 0
        ? `$${gap} ahead of ${row.rivalListing.displayUrl}`
        : `$${Math.abs(gap)} behind ${row.rivalListing.displayUrl}`;

    await writePlatformEvent({
      eventType: "rival_gap",
      listingId,
      metadata: {
        yours: row.listing.displayUrl,
        yoursSlug: row.listing.slug,
        rival: row.rivalListing.displayUrl,
        rivalSlug: row.rivalListing.slug,
        gap,
        gapLabel,
        userId: row.userId,
        passed: gap > 0,
      },
    });
  }
}
