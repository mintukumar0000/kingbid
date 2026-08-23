import { prisma } from "@/lib/db";

/** Explicit keeper level-up rules — earned, not bought. */
export const KEEPER_LEVELS = [
  "observer",
  "member",
  "scout",
  "keeper",
  "senior_keeper",
  "legendary_keeper",
] as const;

export type KeeperLevel = (typeof KEEPER_LEVELS)[number];

const LEVEL_RANK: Record<KeeperLevel, number> = {
  observer: 0,
  member: 1,
  scout: 2,
  keeper: 3,
  senior_keeper: 4,
  legendary_keeper: 5,
};

export async function evaluateKeeperLevel(userId: string, roomId: string): Promise<KeeperLevel> {
  const nominations = await prisma.discoveryList.count({ where: { userId } });
  const roomsCurated = await prisma.room.count({ where: { curatorUserId: userId, status: "active" } });
  const score = await prisma.kingbidScore.findFirst({
    where: { userId },
    orderBy: { computedAt: "desc" },
  });
  const kingbidScore = score?.score ?? 0;

  let level: KeeperLevel = "observer";
  if (nominations >= 1) level = "member";
  if (nominations >= 3) level = "scout";
  if (roomsCurated >= 1 && kingbidScore >= 20) level = "keeper";
  if (roomsCurated >= 3 && kingbidScore >= 50) level = "senior_keeper";
  if (roomsCurated >= 5 && kingbidScore >= 100) level = "legendary_keeper";

  const existing = await prisma.roomKeeper.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });

  if (!existing || LEVEL_RANK[level] > LEVEL_RANK[existing.level as KeeperLevel]) {
    await prisma.roomKeeper.upsert({
      where: { userId_roomId: { userId, roomId } },
      create: { userId, roomId, level, leveledUpAt: new Date() },
      update: { level, leveledUpAt: new Date() },
    });
  }

  return level;
}

export async function getRoomKeepers(roomId: string) {
  return prisma.roomKeeper.findMany({
    where: { roomId, level: { not: "observer" } },
    include: { user: { select: { id: true, handle: true, name: true, email: true } } },
    orderBy: { leveledUpAt: "desc" },
    take: 10,
  });
}

/** Room creation gated by kingbid_score or admin approval. */
export async function canRequestRoom(userId: string): Promise<boolean> {
  const score = await prisma.kingbidScore.findFirst({
    where: { userId },
    orderBy: { computedAt: "desc" },
  });
  return (score?.score ?? 0) >= 30;
}
