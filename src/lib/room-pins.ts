import { prisma } from "@/lib/db";
import { canManageRoom, maxPinsForRoom } from "@/lib/room-keeper-auth";
import { writePlatformEvent } from "@/lib/platform-events";

export async function getRoomPins(roomId: string) {
  const pins = await prisma.roomPin.findMany({
    where: { roomId },
    orderBy: { sortOrder: "asc" },
    include: {
      listing: {
        select: {
          id: true,
          slug: true,
          displayUrl: true,
          title: true,
          currentBid: true,
          clickCount: true,
        },
      },
      pinnedBy: { select: { handle: true, name: true } },
    },
  });
  return pins.map((p) => ({
    id: p.id,
    listingId: p.listingId,
    slug: p.listing.slug,
    displayUrl: p.listing.displayUrl,
    title: p.listing.title,
    currentBid: p.listing.currentBid,
    clickCount: p.listing.clickCount,
    pinnedBy: p.pinnedBy.handle ?? p.pinnedBy.name ?? "keeper",
    sortOrder: p.sortOrder,
  }));
}

export async function pinListing(userId: string, roomId: string, listingSlug: string) {
  if (!(await canManageRoom(userId, roomId))) {
    throw new Error("Senior Keeper, Room Pro keeper, or curator required to pin listings.");
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { categoryId: true },
  });
  if (!room) throw new Error("Room not found.");

  let listing: { id: string; displayUrl: string } | null = null;

  if (room.categoryId) {
    const board = await prisma.board.findFirst({
      where: { categoryId: room.categoryId, region: null },
      select: { id: true },
    });
    if (!board) throw new Error("Board not found.");

    listing = await prisma.listing.findFirst({
      where: { boardId: board.id, slug: listingSlug, status: "active", currentBid: { gt: 0 } },
      select: { id: true, displayUrl: true },
    });
    if (!listing) throw new Error("Listing not found on this room board.");
  } else {
    listing = await prisma.listing.findFirst({
      where: { slug: listingSlug, status: "active", currentBid: { gt: 0 } },
      select: { id: true, displayUrl: true },
    });
    if (!listing) throw new Error("Listing not found — pick from the dropdown.");
  }

  const count = await prisma.roomPin.count({ where: { roomId } });
  const maxPins = await maxPinsForRoom(userId, roomId);
  if (count >= maxPins) {
    throw new Error(`Maximum ${maxPins} pins per room. Unpin one first.`);
  }

  const pin = await prisma.roomPin.create({
    data: {
      roomId,
      listingId: listing.id,
      pinnedByUserId: userId,
      sortOrder: count,
    },
  });

  await writePlatformEvent({
    eventType: "room_pin",
    roomId,
    listingId: listing.id,
    metadata: { displayUrl: listing.displayUrl, action: "pinned" },
  });

  return pin;
}

export async function unpinListing(userId: string, roomId: string, pinId: string) {
  if (!(await canManageRoom(userId, roomId))) {
    throw new Error("Senior Keeper or curator required.");
  }
  await prisma.roomPin.deleteMany({ where: { id: pinId, roomId } });
}
