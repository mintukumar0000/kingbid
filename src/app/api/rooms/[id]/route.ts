import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRoomBySlug } from "@/lib/rooms";
import { getRoomKeepers, evaluateKeeperLevel } from "@/lib/keepers";
import { getOrCreateSessionUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = await getRoomBySlug(id);
  if (!room) {
    const byId = await prisma.room.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true, name: true } },
        curator: { select: { id: true, handle: true, name: true } },
        parentRoom: { select: { slug: true, name: true } },
        _count: { select: { keepers: true, childRooms: true } },
      },
    });
    if (!byId) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return roomPayload(byId);
  }

  const user = await getOrCreateSessionUser();
  await evaluateKeeperLevel(user.id, room.id);
  const keepers = await getRoomKeepers(room.id);

  let boardId: string | null = null;
  let listingCount = 0;
  if (room.categoryId) {
    const board = await prisma.board.findFirst({
      where: { categoryId: room.categoryId, region: null },
      select: { id: true },
    });
    boardId = board?.id ?? null;
    if (boardId) {
      listingCount = await prisma.listing.count({
        where: { boardId, currentBid: { gt: 0 }, status: "active" },
      });
    }
  }

  const myLevel = await prisma.roomKeeper.findUnique({
    where: { userId_roomId: { userId: user.id, roomId: room.id } },
    select: { level: true },
  });

  return NextResponse.json({
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      roomType: room.roomType,
      status: room.status,
      categorySlug: room.category?.slug ?? null,
      boardId,
      listingCount,
      keeperCount: room._count.keepers,
      enterUrl: room.category?.slug ? `/?room=${room.category.slug}` : null,
      parent: room.parentRoom,
      curator: room.curator,
    },
    keepers: keepers.map((k) => ({
      id: k.user.id,
      handle: k.user.handle ?? k.user.email?.split("@")[0] ?? "founder",
      level: k.level,
      profileUrl: `/profile/${k.user.id}`,
    })),
    myKeeperLevel: myLevel?.level ?? "observer",
    levelRules: KEEPER_LEVEL_RULES,
  });
}

const KEEPER_LEVEL_RULES = [
  { level: "member", rule: "Add 1 product to your Discovery list (10 bets)" },
  { level: "scout", rule: "3 Discovery list picks" },
  { level: "keeper", rule: "Curate 1 active room + Kingbid Score ≥ 20" },
  { level: "senior_keeper", rule: "3 active rooms + Score ≥ 50" },
  { level: "legendary_keeper", rule: "5 active rooms + Score ≥ 100" },
];

async function roomPayload(room: {
  id: string;
  slug: string;
  name: string;
  description: string;
  roomType: string;
  status: string;
  category: { slug: string; name: string } | null;
  curator: { id: string; handle: string | null; name: string | null } | null;
  parentRoom: { slug: string; name: string } | null;
  _count: { keepers: number; childRooms: number };
}) {
  return NextResponse.json({
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      status: room.status,
      categorySlug: room.category?.slug ?? null,
      enterUrl: room.category?.slug ? `/?room=${room.category.slug}` : null,
    },
    keepers: [],
    myKeeperLevel: "observer",
    levelRules: KEEPER_LEVEL_RULES,
  });
}
