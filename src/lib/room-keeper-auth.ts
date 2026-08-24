import { prisma } from "@/lib/db";
import { evaluateKeeperLevel, type KeeperLevel } from "@/lib/keepers";
import { keeperLevelRank } from "@/lib/keeper-privileges";
import { hasTier } from "@/lib/subscriptions";

export async function getUserKeeperLevel(userId: string, roomId: string): Promise<KeeperLevel> {
  await evaluateKeeperLevel(userId, roomId);
  const row = await prisma.roomKeeper.findUnique({
    where: { userId_roomId: { userId, roomId } },
    select: { level: true },
  });
  return (row?.level ?? "observer") as KeeperLevel;
}

export async function requireKeeperLevel(
  userId: string,
  roomId: string,
  minLevel: KeeperLevel
): Promise<{ ok: true; level: KeeperLevel } | { ok: false; error: string }> {
  const level = await evaluateKeeperLevel(userId, roomId);
  if (keeperLevelRank(level) < keeperLevelRank(minLevel)) {
    return { ok: false, error: `Requires ${minLevel.replace(/_/g, " ")} level or higher.` };
  }
  const isCurator = await prisma.room.findFirst({
    where: { id: roomId, curatorUserId: userId },
    select: { id: true },
  });
  if (minLevel === "senior_keeper" && !isCurator && level !== "senior_keeper" && level !== "legendary_keeper") {
    return { ok: false, error: "Senior Keeper privileges required." };
  }
  return { ok: true, level };
}

export async function isRoomCurator(userId: string, roomId: string): Promise<boolean> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, curatorUserId: userId },
    select: { id: true },
  });
  return !!room;
}

/** Curator, senior+ keeper, or Room Pro keeper can manage pins/events. */
export async function canManageRoom(userId: string, roomId: string): Promise<boolean> {
  if (await isRoomCurator(userId, roomId)) return true;
  const level = await getUserKeeperLevel(userId, roomId);
  if (keeperLevelRank(level) >= keeperLevelRank("senior_keeper")) return true;
  if ((await hasTier(userId, "room_pro")) && keeperLevelRank(level) >= keeperLevelRank("keeper")) {
    return true;
  }
  return false;
}

export async function maxPinsForRoom(userId: string, roomId: string): Promise<number> {
  let max = MAX_PINS_PER_ROOM;
  if ((await hasTier(userId, "room_pro")) && (await isRoomCurator(userId, roomId))) max += 1;
  return max;
}

export const MAX_PINS_PER_ROOM = 3;
