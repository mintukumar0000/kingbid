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

export async function getRoomEvents(roomId: string, limit = 30) {
  const rows = await prisma.platformEvent.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(formatEvent);
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
    default:
      return "Activity on KingBid";
  }
}
