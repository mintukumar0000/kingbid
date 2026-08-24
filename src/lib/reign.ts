import { prisma } from "@/lib/db";
import { recordReignChangeWithEvents } from "@/lib/reign-events";

export { getGlobalBoardId } from "@/lib/boards";

const listingSelect = {
  id: true,
  slug: true,
  displayUrl: true,
  title: true,
  currentBid: true,
  lastBidAt: true,
} as const;

async function isGlobalBoard(boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { categoryId: true, region: true },
  });
  return board?.categoryId == null && board?.region == null;
}

/** Top paid listing for a board — global uses all listings; category rooms filter by boardId. */
async function getTopListingForBoard(boardId: string) {
  const global = await isGlobalBoard(boardId);
  return prisma.listing.findFirst({
    where: global
      ? { currentBid: { gt: 0 }, status: "active" }
      : { boardId, currentBid: { gt: 0 }, status: "active" },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
    select: listingSelect,
  });
}

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

/** Current #1 — reign history first, then live board top (repairs missing reign rows). */
export async function getCurrentKing(boardId: string) {
  const reign = await prisma.reignHistory.findFirst({
    where: { boardId, endedAt: null, rank: 1 },
    orderBy: { startedAt: "desc" },
    include: { listing: { select: listingSelect } },
  });
  if (reign?.listing) return reign.listing;

  const top = await getTopListingForBoard(boardId);
  if (!top) return null;

  const openForTop = await prisma.reignHistory.findFirst({
    where: { boardId, listingId: top.id, endedAt: null, rank: 1 },
    select: { id: true },
  });
  if (!openForTop) {
    await prisma.reignHistory.create({
      data: {
        boardId,
        listingId: top.id,
        rank: 1,
        startedAt: top.lastBidAt ?? new Date(),
      },
    });
  }

  return top;
}

export async function getNextChallenger(boardId: string, kingId: string | null) {
  const global = await isGlobalBoard(boardId);
  return prisma.listing.findFirst({
    where: {
      ...(global ? {} : { boardId }),
      currentBid: { gt: 0 },
      status: "active",
      ...(kingId ? { id: { not: kingId } } : {}),
    },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      displayUrl: true,
      title: true,
      currentBid: true,
    },
  });
}
