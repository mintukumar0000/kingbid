import { prisma } from "@/lib/db";
import { recordReignChangeWithEvents } from "@/lib/reign-events";

export { getGlobalBoardId } from "@/lib/boards";

/** Close prior #1 reign, record dethronement, open new reign, emit platform events. */
export async function recordReignChange(
  boardId: string,
  newTopListingId: string,
  previousTopListingId: string | null
): Promise<void> {
  await recordReignChangeWithEvents(boardId, newTopListingId, previousTopListingId);
}

export async function reignDuration(listingId: string, boardId: string): Promise<string | null> {
  const open = await prisma.reignHistory.findFirst({
    where: { listingId, boardId, endedAt: null, rank: 1 },
    orderBy: { startedAt: "desc" },
  });
  if (!open) return null;

  const ms = Date.now() - open.startedAt.getTime();
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / 60_000);
  return `${mins}m`;
}

export async function getBoardHistory(boardId: string, limit = 50) {
  return prisma.reignHistory.findMany({
    where: { boardId, rank: 1 },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      listing: { select: { slug: true, displayUrl: true, title: true, currentBid: true } },
    },
  });
}

export async function getCurrentKing(boardId: string) {
  const reign = await prisma.reignHistory.findFirst({
    where: { boardId, endedAt: null, rank: 1 },
    orderBy: { startedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          slug: true,
          displayUrl: true,
          title: true,
          currentBid: true,
          lastBidAt: true,
        },
      },
    },
  });
  return reign?.listing ?? null;
}

export async function getNextChallenger(boardId: string, kingId: string | null) {
  const where = {
    boardId,
    currentBid: { gt: 0 },
    status: "active" as const,
    ...(kingId ? { id: { not: kingId } } : {}),
  };
  return prisma.listing.findFirst({
    where,
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
    select: {
      id: true,
      slug: true,
      displayUrl: true,
      title: true,
      currentBid: true,
    },
  });
}
