import { prisma } from "@/lib/db";
import { canManageRoom, requireKeeperLevel } from "@/lib/room-keeper-auth";
import { writePlatformEvent } from "@/lib/platform-events";

export function startOfWeekUtc(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function getRoomWeeklyEvents(roomId: string) {
  const weekStart = startOfWeekUtc();
  const [thisWeek, recent] = await Promise.all([
    prisma.roomWeeklyEvent.findMany({
      where: { roomId, weekStart: { gte: weekStart } },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { handle: true, name: true } } },
    }),
    prisma.roomWeeklyEvent.findMany({
      where: { roomId },
      orderBy: { weekStart: "desc" },
      take: 5,
      include: { createdBy: { select: { handle: true, name: true } } },
    }),
  ]);
  return { thisWeek, recent };
}

export async function createRoomWeeklyEvent(
  userId: string,
  roomId: string,
  input: { title: string; description?: string }
) {
  const gate = await requireKeeperLevel(userId, roomId, "senior_keeper");
  if (!gate.ok && !(await canManageRoom(userId, roomId))) {
    throw new Error(gate.error);
  }

  const title = input.title.trim();
  if (title.length < 3) throw new Error("Event title too short.");

  const weekStart = startOfWeekUtc();
  const existing = await prisma.roomWeeklyEvent.count({
    where: { roomId, weekStart: { gte: weekStart } },
  });
  if (existing >= 2) throw new Error("Max 2 weekly events per room per week.");

  const event = await prisma.roomWeeklyEvent.create({
    data: {
      roomId,
      title,
      description: input.description?.trim() ?? "",
      createdByUserId: userId,
      weekStart,
    },
  });

  await writePlatformEvent({
    eventType: "room_weekly_event",
    roomId,
    metadata: { title, description: input.description ?? "" },
  });

  return event;
}
