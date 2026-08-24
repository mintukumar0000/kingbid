import { prisma } from "@/lib/db";
import { writePlatformEvent } from "@/lib/platform-events";
import { hasTier } from "@/lib/subscriptions";

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

export function keeperLevelRank(level: string): number {
  const idx = KEEPER_LEVELS.indexOf(level as KeeperLevel);
  return idx >= 0 ? idx : 0;
}

/** Global keeper rank from discovery bets, curated rooms, and score. */
export async function getGlobalKeeperLevel(userId: string): Promise<KeeperLevel> {
  const nominations = await prisma.discoveryList.count({ where: { userId } });
  const roomsCurated = await prisma.room.count({
    where: { curatorUserId: userId, status: "active" },
  });
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
  return level;
}

/** Discovery bet cap by global level. */
export function discoveryBetLimit(level: KeeperLevel): number {
  if (level === "observer") return 0;
  if (level === "member") return 1;
  return 10;
}

/** Max curated community rooms by global level. */
export function curatedRoomLimit(level: KeeperLevel): number {
  if (level === "legendary_keeper") return 5;
  if (level === "senior_keeper") return 3;
  return 1;
}

/** Max curated community rooms by global level (+1 with Room Pro). */
export async function curatedRoomLimitForUser(userId: string): Promise<number> {
  const level = await getGlobalKeeperLevel(userId);
  let limit = curatedRoomLimit(level);
  if (await hasTier(userId, "room_pro")) limit += 1;
  return limit;
}

export async function getKeeperQuotas(userId: string) {
  const level = await getGlobalKeeperLevel(userId);
  const [discoveryUsed, roomsCurated, roomLimit] = await Promise.all([
    prisma.discoveryList.count({ where: { userId } }),
    prisma.room.count({ where: { curatorUserId: userId, status: "active" } }),
    curatedRoomLimitForUser(userId),
  ]);
  const discoveryLimit = discoveryBetLimit(level);
  return {
    level,
    discoveryUsed,
    discoveryLimit,
    discoveryRemaining: Math.max(0, discoveryLimit - discoveryUsed),
    roomsCurated,
    roomLimit,
    roomsRemaining: Math.max(0, roomLimit - roomsCurated),
    hasRoomPro: await hasTier(userId, "room_pro"),
  };
}

export async function canAddDiscoveryBet(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const quotas = await getKeeperQuotas(userId);
  if (quotas.discoveryUsed === 0 && quotas.level === "observer") {
    return { ok: true };
  }
  if (quotas.discoveryRemaining <= 0) {
    if (quotas.level === "member") {
      return { ok: false, error: "Member limit: 1 Discovery bet. Add 2 more picks total to reach Scout (10 bets)." };
    }
    if (quotas.level === "observer") {
      return { ok: false, error: "Visit a room and follow activity first, then add your first Discovery bet." };
    }
    return { ok: false, error: "Discovery list full (10/10)." };
  }
  return { ok: true };
}

export async function canCreateAnotherRoom(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const quotas = await getKeeperQuotas(userId);
  if (quotas.roomsRemaining > 0) return { ok: true };
  if (quotas.level === "legendary_keeper") {
    return { ok: false, error: "Legendary limit: 5 curated rooms max." };
  }
  if (quotas.level === "senior_keeper") {
    return { ok: false, error: "Senior Keeper limit: 3 rooms. Reach Legendary (5 rooms + score 100) for 5." };
  }
  return {
    ok: false,
    error: "Keeper limit: 1 curated room. Reach Senior Keeper (3 rooms + score 50) for more.",
  };
}

export async function evaluateKeeperLevel(userId: string, roomId: string): Promise<KeeperLevel> {
  const level = await getGlobalKeeperLevel(userId);

  const existing = await prisma.roomKeeper.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });

  const prevLevel = (existing?.level ?? "observer") as KeeperLevel;
  const leveledUp = LEVEL_RANK[level] > LEVEL_RANK[prevLevel];

  if (!existing || leveledUp) {
    await prisma.roomKeeper.upsert({
      where: { userId_roomId: { userId, roomId } },
      create: { userId, roomId, level, leveledUpAt: new Date() },
      update: { level, leveledUpAt: new Date() },
    });

    if (leveledUp && level !== "observer") {
      const [user, room] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { handle: true, name: true } }),
        prisma.room.findUnique({ where: { id: roomId }, select: { name: true, slug: true } }),
      ]);
      await writePlatformEvent({
        eventType: "keeper_level_up",
        roomId,
        metadata: {
          level,
          prevLevel,
          userHandle: user?.handle ?? user?.name ?? "keeper",
          userId,
          roomName: room?.name,
          roomSlug: room?.slug,
        },
      });
    }
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
