import { prisma } from "@/lib/db";

/** Close prior #1 reign row and open a new one when top spot changes. */
export async function recordReignChange(
  boardId: string,
  newTopListingId: string,
  previousTopListingId: string | null
): Promise<void> {
  if (previousTopListingId === newTopListingId) return;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (previousTopListingId) {
      await tx.reignHistory.updateMany({
        where: { boardId, listingId: previousTopListingId, endedAt: null, rank: 1 },
        data: { endedAt: now },
      });
    }

    await tx.reignHistory.create({
      data: {
        boardId,
        listingId: newTopListingId,
        rank: 1,
        startedAt: now,
      },
    });
  });
}

export { getGlobalBoardId } from "@/lib/boards";

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
