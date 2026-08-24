import { prisma } from "@/lib/db";
import { writePlatformEvent } from "@/lib/platform-events";
import type { KeeperLevel } from "@/lib/keepers";
import { keeperLevelLabel } from "@/lib/keeper-privileges";

const KEEPER_REF_COOKIE = "kb_keeper_ref";

export function keeperRefCookieName(): string {
  return KEEPER_REF_COOKIE;
}

/** Track ?keeper=userId on room URLs — attributes visits to inviter. */
export async function recordKeeperInviteVisit(
  inviterUserId: string,
  roomSlug: string,
  visitorUserId?: string
): Promise<void> {
  const room = await prisma.room.findUnique({ where: { slug: roomSlug }, select: { id: true, name: true } });
  if (!room) return;

  const inviter = await prisma.user.findUnique({
    where: { id: inviterUserId },
    select: { handle: true, name: true },
  });
  const handle = inviter?.handle ?? inviter?.name ?? "keeper";

  await writePlatformEvent({
    eventType: "keeper_invite",
    roomId: room.id,
    metadata: {
      roomSlug,
      roomName: room.name,
      inviterUserId,
      inviterHandle: handle,
      visitorUserId: visitorUserId ?? null,
    },
  });
}

export function buildKeeperShareText(params: {
  level: KeeperLevel;
  roomName?: string;
  roomSlug?: string;
  userHandle?: string;
}): string {
  const label = keeperLevelLabel(params.level);
  const who = params.userHandle ? `@${params.userHandle}` : "I";
  if (params.roomName && params.roomSlug) {
    return `${who} just became ${label} of ${params.roomName} on Kingbid — join the room!`;
  }
  return `${who} leveled up to ${label} on Kingbid — discover, evaluate, compete, return.`;
}

export function buildKeeperShareUrl(roomSlug?: string, userId?: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingbid.lol";
  if (roomSlug && userId) {
    return `${base}/rooms/${roomSlug}?keeper=${encodeURIComponent(userId)}`;
  }
  if (roomSlug) return `${base}/rooms/${roomSlug}`;
  return `${base}/founders`;
}

export function twitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
