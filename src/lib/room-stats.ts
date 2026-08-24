import { prisma } from "@/lib/db";
import { getRoomBySlug, getRoomByCategorySlug } from "@/lib/rooms";
import { getRoomKeepers } from "@/lib/keepers";
import { reignDuration } from "@/lib/reign";
import { getRoomMemberCount, isFollowingRoom } from "@/lib/follows";
import { getRoomPins } from "@/lib/room-pins";
import { canManageRoom } from "@/lib/room-keeper-auth";

export async function resolveRoomRecord(slugOrCategory: string) {
  const bySlug = await getRoomBySlug(slugOrCategory);
  if (bySlug) return bySlug;
  return getRoomByCategorySlug(slugOrCategory);
}

export async function getRoomBoardStats(categoryId: string | null) {
  if (!categoryId) {
    return {
      boardId: null as string | null,
      listingCount: 0,
      totalBidCents: 0,
      totalClicks: 0,
      currentKing: null as {
        slug: string;
        displayUrl: string;
        title: string;
        currentBid: number;
        clickCount: number;
        reignLabel: string | null;
      } | null,
    };
  }

  const board = await prisma.board.findFirst({
    where: { categoryId, region: null },
    select: { id: true },
  });
  if (!board) {
    return {
      boardId: null,
      listingCount: 0,
      totalBidCents: 0,
      totalClicks: 0,
      currentKing: null,
    };
  }

  const listings = await prisma.listing.findMany({
    where: { boardId: board.id, currentBid: { gt: 0 }, status: "active" },
    select: {
      id: true,
      slug: true,
      displayUrl: true,
      title: true,
      currentBid: true,
      clickCount: true,
    },
    orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
  });

  const top = listings[0] ?? null;
  let reignLabel: string | null = null;
  if (top) {
    reignLabel = await reignDuration(top.id, board.id);
  }

  return {
    boardId: board.id,
    listingCount: listings.length,
    totalBidCents: listings.reduce((s, l) => s + l.currentBid, 0),
    totalClicks: listings.reduce((s, l) => s + l.clickCount, 0),
    currentKing: top
      ? {
          slug: top.slug,
          displayUrl: top.displayUrl,
          title: top.title,
          currentBid: top.currentBid,
          clickCount: top.clickCount,
          reignLabel: reignLabel ? `held for ${reignLabel}` : null,
        }
      : null,
  };
}

export async function getRoomCommunityPayload(slugOrCategory: string, userId?: string) {
  const room = await resolveRoomRecord(slugOrCategory);
  if (!room) return null;

  const stats = await getRoomBoardStats(room.categoryId);
  const keepers = await getRoomKeepers(room.id);
  const [memberCount, pins, following, canManage, isCurator] = await Promise.all([
    getRoomMemberCount(room.id),
    getRoomPins(room.id),
    userId ? isFollowingRoom(userId, room.id) : Promise.resolve(false),
    userId ? canManageRoom(userId, room.id) : Promise.resolve(false),
    userId ? Promise.resolve(room.curatorUserId === userId) : Promise.resolve(false),
  ]);

  const primaryKeeper =
    keepers.find((k) => k.level === "keeper" || k.level === "senior_keeper" || k.level === "legendary_keeper") ??
    keepers[0] ??
    null;

  const headKeeper = room.curator
    ? {
        id: room.curator.id,
        handle: room.curator.handle ?? room.curator.name ?? "keeper",
        profileUrl: `/profile/${room.curator.id}`,
        level: "keeper" as const,
        isCurator: true,
      }
    : primaryKeeper
      ? {
          id: primaryKeeper.user.id,
          handle: primaryKeeper.user.handle ?? primaryKeeper.user.email?.split("@")[0] ?? "keeper",
          profileUrl: `/profile/${primaryKeeper.user.id}`,
          level: primaryKeeper.level,
          isCurator: false,
        }
      : null;

  const breadcrumbs: { slug: string; name: string; href: string }[] = [];
  if (room.parentRoom) {
    breadcrumbs.push({
      slug: room.parentRoom.slug,
      name: room.parentRoom.name,
      href: `/rooms/${room.parentRoom.slug}`,
    });
  }

  return {
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      roomType: room.roomType,
      status: room.status,
      categorySlug: room.category?.slug ?? null,
      boardId: stats.boardId,
      listingCount: stats.listingCount,
      founderCount: stats.listingCount,
      productCount: stats.listingCount,
      memberCount,
      totalBidCents: stats.totalBidCents,
      totalClicks: stats.totalClicks,
      keeperCount: room._count.keepers,
      followCount: room._count.follows,
      childRoomCount: room._count.childRooms,
      childRooms: "childRooms" in room ? (room as { childRooms: { slug: string; name: string; roomType: string }[] }).childRooms : [],
      enterUrl: room.category?.slug ? `/?room=${room.category.slug}` : null,
      parent: room.parentRoom,
      breadcrumbs,
      createdAt: room.createdAt.toISOString(),
    },
    headKeeper,
    currentKing: stats.currentKing,
    keepers: keepers.map((k) => ({
      id: k.user.id,
      handle: k.user.handle ?? k.user.email?.split("@")[0] ?? "founder",
      level: k.level,
      profileUrl: `/profile/${k.user.id}`,
    })),
    pins,
    isFollowing: following,
    canManage,
    isCurator,
  };
}
