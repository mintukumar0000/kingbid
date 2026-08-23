import { prisma } from "@/lib/db";
import { getDiscoveryList } from "@/lib/kingmaker";
import { keeperLevelLabel } from "@/lib/keeper-privileges";

export async function getKeeperProfileStats(userId: string) {
  const [curatedRooms, keeperRows, discovery] = await Promise.all([
    prisma.room.findMany({
      where: { curatorUserId: userId, status: "active" },
      select: { id: true, slug: true, name: true, categoryId: true, createdAt: true },
    }),
    prisma.roomKeeper.findMany({
      where: { userId, level: { not: "observer" } },
      include: { room: { select: { slug: true, name: true, categoryId: true } } },
    }),
    getDiscoveryList(userId),
  ]);

  const roomIds = new Set([
    ...curatedRooms.map((r) => r.id),
    ...keeperRows.filter((k) => k.level === "keeper" || k.level === "senior_keeper" || k.level === "legendary_keeper").map((k) => k.roomId),
  ]);

  let productsInRooms = 0;
  let clicksInRooms = 0;
  let bidVolumeCents = 0;

  for (const room of curatedRooms) {
    if (!room.categoryId) continue;
    const board = await prisma.board.findFirst({
      where: { categoryId: room.categoryId, region: null },
      select: { id: true },
    });
    if (!board) continue;
    const agg = await prisma.listing.aggregate({
      where: { boardId: board.id, currentBid: { gt: 0 }, status: "active" },
      _count: true,
      _sum: { currentBid: true, clickCount: true },
    });
    productsInRooms += agg._count;
    bidVolumeCents += agg._sum.currentBid ?? 0;
    clicksInRooms += agg._sum.clickCount ?? 0;
  }

  let successfulProducts = 0;
  for (const pick of discovery) {
    const top = await prisma.listing.findFirst({
      where: { boardId: pick.listing.boardId, currentBid: { gt: 0 }, status: "active" },
      orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
      select: { id: true },
    });
    if (top?.id === pick.listingId) successfulProducts++;
  }

  const roomsListed = [
    ...curatedRooms.map((r) => ({ slug: r.slug, name: r.name, role: "Curator" as const })),
    ...keeperRows
      .filter((k) => !curatedRooms.some((c) => c.id === k.roomId))
      .map((k) => ({ slug: k.room.slug, name: k.room.name, role: keeperLevelLabel(k.level) })),
  ];

  return {
    roomsCurated: curatedRooms.length,
    keeperRoomCount: roomIds.size,
    productsDiscovered: discovery.length,
    successfulProducts,
    membersInRooms: productsInRooms,
    totalClicksCurated: clicksInRooms,
    bidVolumeCurated: bidVolumeCents,
    rooms: roomsListed,
  };
}

function keeperLevelLabel(level: string): string {
  return level.replace(/_/g, " ");
}
