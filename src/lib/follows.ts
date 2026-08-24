import { prisma } from "@/lib/db";
import { evaluateKeeperLevel } from "@/lib/keepers";
import { writePlatformEvent } from "@/lib/platform-events";

export async function followRoom(userId: string, roomId: string) {
  await evaluateKeeperLevel(userId, roomId);
  const follow = await prisma.roomFollow.upsert({
    where: { userId_roomId: { userId, roomId } },
    create: { userId, roomId },
    update: {},
  });

  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { name: true } });
  await writePlatformEvent({
    eventType: "room_follow",
    roomId,
    metadata: { roomName: room?.name ?? "Room", userId },
  });

  return follow;
}

export async function unfollowRoom(userId: string, roomId: string) {
  await prisma.roomFollow.deleteMany({ where: { userId, roomId } });
}

export async function isFollowingRoom(userId: string, roomId: string) {
  const row = await prisma.roomFollow.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  return !!row;
}

export async function getRoomMemberCount(roomId: string): Promise<number> {
  const [follows, keepers] = await Promise.all([
    prisma.roomFollow.findMany({ where: { roomId }, select: { userId: true } }),
    prisma.roomKeeper.findMany({
      where: { roomId, level: { not: "observer" } },
      select: { userId: true },
    }),
  ]);
  return new Set([...follows.map((f) => f.userId), ...keepers.map((k) => k.userId)]).size;
}

export async function followFounder(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error("Cannot follow yourself.");
  return prisma.founderFollow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

export async function unfollowFounder(followerId: string, followingId: string) {
  await prisma.founderFollow.deleteMany({ where: { followerId, followingId } });
}

export async function isFollowingFounder(followerId: string, followingId: string) {
  const row = await prisma.founderFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!row;
}

export async function getFollowFeed(userId: string, limit = 30) {
  const [roomFollows, founderFollows] = await Promise.all([
    prisma.roomFollow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            id: true,
            slug: true,
            name: true,
            categoryId: true,
            category: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.founderFollow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, handle: true, name: true } } },
    }),
  ]);

  const roomIds = roomFollows.map((f) => f.roomId);
  const founderIds = founderFollows.map((f) => f.followingId);

  const roomEvents =
    roomIds.length > 0
      ? await prisma.platformEvent.findMany({
          where: { roomId: { in: roomIds } },
          orderBy: { createdAt: "desc" },
          take: limit * 2,
        })
      : [];

  const founderActivity = await Promise.all(
    founderIds.slice(0, 10).map(async (founderId) => {
      const bets = await prisma.discoveryList.findMany({
        where: { userId: founderId },
        orderBy: { calledAt: "desc" },
        take: 3,
        include: { listing: { select: { slug: true, displayUrl: true } } },
      });
      const user = founderFollows.find((f) => f.followingId === founderId)?.following;
      return bets.map((b) => ({
        type: "founder_discovery" as const,
        at: b.calledAt.toISOString(),
        handle: user?.handle ?? user?.name ?? "founder",
        founderId,
        headline: `@${user?.handle ?? user?.name ?? "founder"} added ${b.listing.displayUrl} to Discovery`,
        listingSlug: b.listing.slug,
      }));
    })
  );

  const followItems = roomFollows.map((f) => ({
    type: "room_subscribed" as const,
    at: f.createdAt.toISOString(),
    roomId: f.roomId,
    headline: `Following ${f.room.name} — waiting for bids & crown changes`,
  }));

  const feed = [
    ...roomEvents.map((e) => ({
      type: "room_event" as const,
      at: e.createdAt.toISOString(),
      roomId: e.roomId,
      eventType: e.eventType,
      headline: parseEventHeadline(e.eventType, e.metadata),
    })),
    ...founderActivity.flat(),
    ...followItems,
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);

  return {
    followedRooms: roomFollows.map((f) => ({
      id: f.room.id,
      slug: f.room.slug,
      name: f.room.name,
      enterUrl: f.room.category?.slug
        ? `/?room=${f.room.category.slug}`
        : `/rooms/${f.room.slug}`,
    })),
    followedFounders: founderFollows.map((f) => ({
      id: f.following.id,
      handle: f.following.handle ?? f.following.name ?? "founder",
      profileUrl: `/profile/${f.following.id}`,
    })),
    feed,
  };
}

function parseEventHeadline(eventType: string, metadataJson: string): string {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(metadataJson) as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  switch (eventType) {
    case "dethronement":
      return `${metadata.displayUrl ?? "Listing"} lost #1`;
    case "new_reign":
      return `${metadata.displayUrl ?? "Listing"} took #1`;
    case "breakout":
      return `${metadata.displayUrl ?? "Listing"} breaking out`;
    case "room_weekly_event":
      return String(metadata.title ?? "Weekly room event");
    case "room_follow":
      return `New follower joined ${metadata.roomName ?? "this room"}`;
    default:
      return "Room activity";
  }
}

export async function getUserFollowStats(userId: string) {
  const [roomsFollowed, foundersFollowed, roomMembers] = await Promise.all([
    prisma.roomFollow.count({ where: { userId } }),
    prisma.founderFollow.count({ where: { followerId: userId } }),
    prisma.roomFollow.count({
      where: { room: { OR: [{ curatorUserId: userId }, { keepers: { some: { userId, level: { in: ["keeper", "senior_keeper", "legendary_keeper"] } } } }] } },
    }),
  ]);
  return { roomsFollowed, foundersFollowed, roomMembers };
}
