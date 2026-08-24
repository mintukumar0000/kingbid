import { prisma } from "@/lib/db";
import { getDiscoveryList } from "@/lib/kingmaker";
import { keeperLevelLabel } from "@/lib/keeper-privileges";

/** Discovery picks that reached #1 at any point after the bet was placed. */
async function countSuccessfulDiscoveryCalls(userId: string, discovery: Awaited<ReturnType<typeof getDiscoveryList>>) {
  let count = 0;
  for (const pick of discovery) {
    const reachedOne = await prisma.reignHistory.findFirst({
      where: {
        listingId: pick.listingId,
        rank: 1,
        startedAt: { gte: pick.calledAt },
      },
      select: { id: true },
    });
    if (reachedOne) count++;
  }
  return count;
}

export async function getKeeperProfileStats(userId: string) {
  const [curatedRooms, keeperRows, discovery, followStats] = await Promise.all([
    prisma.room.findMany({
      where: { curatorUserId: userId, status: "active" },
      select: {
        id: true,
        slug: true,
        name: true,
        categoryId: true,
        createdAt: true,
        category: { select: { slug: true } },
      },
    }),
    prisma.roomKeeper.findMany({
      where: { userId, level: { not: "observer" } },
      include: { room: { select: { slug: true, name: true, categoryId: true } } },
    }),
    getDiscoveryList(userId),
    Promise.all([
      prisma.roomFollow.count({
        where: {
          room: {
            OR: [
              { curatorUserId: userId },
              { keepers: { some: { userId, level: { in: ["keeper", "senior_keeper", "legendary_keeper"] } } } },
            ],
          },
        },
      }),
      prisma.founderFollow.count({ where: { followingId: userId } }),
    ]),
  ]);

  const [membersInRooms, founderFollowers] = followStats;

  const roomIds = new Set([
    ...curatedRooms.map((r) => r.id),
    ...keeperRows
      .filter((k) => k.level === "keeper" || k.level === "senior_keeper" || k.level === "legendary_keeper")
      .map((k) => k.roomId),
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

  const successfulProducts = await countSuccessfulDiscoveryCalls(userId, discovery);

  const roomsListed = [
    ...curatedRooms.map((r) => ({
      slug: r.slug,
      name: r.name,
      role: "Curator" as const,
      enterUrl: r.category?.slug ? `/?room=${r.category.slug}` : `/rooms/${r.slug}`,
    })),
    ...keeperRows
      .filter((k) => !curatedRooms.some((c) => c.id === k.roomId))
      .map((k) => ({
        slug: k.room.slug,
        name: k.room.name,
        role: keeperLevelLabel(k.level),
        enterUrl: `/rooms/${k.room.slug}`,
      })),
  ];

  return {
    roomsCurated: curatedRooms.length,
    keeperRoomCount: roomIds.size,
    productsDiscovered: discovery.length,
    successfulProducts,
    membersInRooms,
    founderFollowers,
    productsInCuratedRooms: productsInRooms,
    totalClicksCurated: clicksInRooms,
    bidVolumeCurated: bidVolumeCents,
    rooms: roomsListed,
  };
}
