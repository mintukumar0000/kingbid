import { prisma } from "@/lib/db";
import { writePlatformEvent } from "@/lib/platform-events";

async function roomIdForBoard(boardId: string): Promise<string | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { categoryId: true },
  });
  if (!board?.categoryId) return null;
  const room = await prisma.room.findFirst({
    where: { categoryId: board.categoryId },
    select: { id: true },
  });
  return room?.id ?? null;
}

/** Full reign transition: dethronement row + reign history + platform events. */
export async function recordReignChangeWithEvents(
  boardId: string,
  newTopListingId: string,
  previousTopListingId: string | null
): Promise<void> {
  if (previousTopListingId === newTopListingId) return;

  const now = new Date();
  const roomId = await roomIdForBoard(boardId);

  const [newListing, prevListing] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: newTopListingId },
      select: { displayUrl: true, currentBid: true, slug: true },
    }),
    previousTopListingId
      ? prisma.listing.findUnique({
          where: { id: previousTopListingId },
          select: { displayUrl: true, currentBid: true, slug: true },
        })
      : null,
  ]);

  const priorReign = previousTopListingId
    ? await prisma.reignHistory.findFirst({
        where: { boardId, listingId: previousTopListingId, rank: 1 },
        orderBy: { startedAt: "desc" },
      })
    : null;

  const hadPriorReign = previousTopListingId
    ? await prisma.reignHistory.count({
        where: { boardId, listingId: newTopListingId, rank: 1, endedAt: { not: null } },
      })
    : 0;
  const isComeback = hadPriorReign > 0;

  await prisma.$transaction(async (tx) => {
    if (previousTopListingId) {
      await tx.reignHistory.updateMany({
        where: { boardId, listingId: previousTopListingId, endedAt: null, rank: 1 },
        data: { endedAt: now },
      });

      await tx.dethronement.create({
        data: {
          boardId,
          listingId: previousTopListingId,
          dethronedByListingId: newTopListingId,
          occurredAt: now,
        },
      });
    }

    await tx.reignHistory.create({
      data: {
        boardId,
        listingId: newTopListingId,
        rank: 1,
        startedAt: now,
        isComeback,
      },
    });
  });

  if (previousTopListingId && prevListing && newListing) {
    await writePlatformEvent({
      eventType: "dethronement",
      boardId,
      roomId,
      listingId: previousTopListingId,
      metadata: {
        displayUrl: prevListing.displayUrl,
        slug: prevListing.slug,
        newTop: newListing.displayUrl,
        newTopId: newTopListingId,
        bid: newListing.currentBid,
      },
    });
  }

  await writePlatformEvent({
    eventType: isComeback ? "comeback" : "new_reign",
    boardId,
    roomId,
    listingId: newTopListingId,
    metadata: {
      displayUrl: newListing?.displayUrl,
      slug: newListing?.slug,
      bid: newListing?.currentBid,
    },
  });

  if (priorReign?.startedAt) {
    const hours = Math.floor((now.getTime() - priorReign.startedAt.getTime()) / 3_600_000);
    if (hours >= 24) {
      await writePlatformEvent({
        eventType: "milestone_reign",
        boardId,
        roomId,
        listingId: previousTopListingId!,
        metadata: {
          displayUrl: prevListing?.displayUrl,
          duration: `${Math.floor(hours / 24)}d ${hours % 24}h`,
        },
      });
    }
  }
}
