// Persistent platform event store — single source for feeds, share cards, notifications.
// Distinct from in-process SSE bus in events.ts.

import { prisma } from "@/lib/db";

export const PLATFORM_EVENT_TYPES = [
  "dethronement",
  "new_reign",
  "comeback",
  "milestone_reign",
  "breakout",
  "new_founder",
  "kingmaker_called_it",
  "room_weekly_event",
  "room_pin",
  "room_follow",
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

export interface WritePlatformEventInput {
  eventType: PlatformEventType;
  boardId?: string | null;
  roomId?: string | null;
  listingId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writePlatformEvent(input: WritePlatformEventInput) {
  return prisma.platformEvent.create({
    data: {
      eventType: input.eventType,
      boardId: input.boardId ?? null,
      roomId: input.roomId ?? null,
      listingId: input.listingId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function getRoomEvents(roomId: string, limit = 30, thisWeekOnly = true) {
  const where: { roomId: string; createdAt?: { gte: Date } } = { roomId };
  if (thisWeekOnly) {
    const weekStart = startOfWeekUtc();
    where.createdAt = { gte: weekStart };
  }
  const rows = await prisma.platformEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const weeklyEvents = await prisma.roomWeeklyEvent.findMany({
    where: { roomId, ...(thisWeekOnly ? { weekStart: { gte: startOfWeekUtc() } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { createdBy: { select: { handle: true, name: true } } },
  });

  const platformFormatted = rows.map(formatEvent);
  const weeklyFormatted = weeklyEvents.map((w) => ({
    id: w.id,
    eventType: "room_weekly_event",
    boardId: null,
    roomId: w.roomId,
    listingId: null,
    metadata: {
      title: w.title,
      description: w.description,
      createdBy: w.createdBy.handle ?? w.createdBy.name ?? "keeper",
    },
    at: w.createdAt.toISOString(),
  }));

  return [...weeklyFormatted, ...platformFormatted]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

function startOfWeekUtc(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function getBoardEvents(boardId: string, limit = 30) {
  const rows = await prisma.platformEvent.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(formatEvent);
}

export async function getRecentPlatformEvents(limit = 20) {
  const rows = await prisma.platformEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(formatEvent);
}

function formatEvent(row: {
  id: string;
  eventType: string;
  boardId: string | null;
  roomId: string | null;
  listingId: string | null;
  metadata: string;
  createdAt: Date;
}) {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(row.metadata) as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  return {
    id: row.id,
    eventType: row.eventType,
    boardId: row.boardId,
    roomId: row.roomId,
    listingId: row.listingId,
    metadata,
    at: row.createdAt.toISOString(),
  };
}

export function eventHeadline(
  eventType: string,
  metadata: Record<string, unknown>
): string {
  switch (eventType) {
    case "dethronement":
      return `${metadata.displayUrl ?? "A listing"} lost #1 to ${metadata.newTop ?? "a challenger"}`;
    case "new_reign":
      return `${metadata.displayUrl ?? "A listing"} took #1 at ${metadata.bid ?? ""}`;
    case "comeback":
      return `${metadata.displayUrl ?? "A listing"} reclaimed #1`;
    case "milestone_reign":
      return `${metadata.displayUrl ?? "A listing"} held #1 for ${metadata.duration ?? ""}`;
    case "breakout":
      return `${metadata.displayUrl ?? "A listing"} is breaking out (+${metadata.growthPct ?? 0}% bids)`;
    case "new_founder":
      return `${metadata.displayUrl ?? "A new founder"} joined the board`;
    case "kingmaker_called_it":
      return `${metadata.userHandle ?? "Someone"} called it on ${metadata.displayUrl ?? "a listing"}`;
    case "room_weekly_event":
      return `📅 ${metadata.title ?? "Weekly event"} — ${metadata.createdBy ?? "keeper"}`;
    case "room_pin":
      return `📌 Pinned ${metadata.displayUrl ?? "a listing"}`;
    case "room_follow":
      return `👋 Someone followed ${metadata.roomName ?? "this room"}`;
    default:
      return "Activity on KingBid";
  }
}
