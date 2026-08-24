import { NextResponse } from "next/server";
import { syncRoomsFromCategories, requestRoom, getRoomBySlug } from "@/lib/rooms";
import { getOrCreateSessionUser } from "@/lib/users";
import { getRoomKeepers, evaluateKeeperLevel } from "@/lib/keepers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("sync") === "1") {
    await syncRoomsFromCategories();
  }

  const rooms = await prisma.room.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    include: {
      category: { select: { slug: true } },
      parentRoom: { select: { slug: true } },
      _count: { select: { keepers: true, childRooms: true, follows: true } },
    },
  });

  const withCounts = await Promise.all(
    rooms.map(async (r) => {
      let listingCount = 0;
      if (r.categoryId) {
        const board = await prisma.board.findFirst({
          where: { categoryId: r.categoryId, region: null },
          select: { id: true },
        });
        if (board) {
          listingCount = await prisma.listing.count({
            where: { boardId: board.id, currentBid: { gt: 0 }, status: "active" },
          });
        }
      }
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        roomType: r.roomType,
        parentSlug: r.parentRoom?.slug ?? null,
        categorySlug: r.category?.slug ?? null,
        keeperCount: r._count.keepers,
        memberCount: r._count.follows,
        listingCount,
        enterUrl: r.category?.slug ? `/?room=${r.category.slug}` : `/rooms/${r.slug}`,
      };
    })
  );

  return NextResponse.json({ rooms: withCounts });
}

const createSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  roomType: z.enum(["category", "geo", "founder_type", "tech"]).optional(),
  parentRoomId: z.string().uuid().optional(),
  geoRelevanceNote: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid room data." }, { status: 400 });
  }

  const user = await getOrCreateSessionUser();
  try {
    const room = await requestRoom(user.id, parsed.data);
    return NextResponse.json({
      id: room.id,
      slug: room.slug,
      status: room.status,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
