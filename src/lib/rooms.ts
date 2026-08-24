import { prisma } from "@/lib/db";
import { canRequestRoom, canCreateAnotherRoom } from "@/lib/keepers";

export async function resolveRoomByPath(segments: string[]) {
  if (segments.length === 0) return null;
  let parentId: string | null = null;
  let room = null;
  for (const segment of segments) {
    room = await prisma.room.findFirst({
      where: { slug: segment, parentRoomId: parentId, status: "active" },
      include: {
        category: { select: { slug: true, name: true } },
        curator: { select: { id: true, handle: true, name: true } },
        parentRoom: { select: { slug: true, name: true } },
        childRooms: { where: { status: "active" }, select: { slug: true, name: true, roomType: true } },
        _count: { select: { keepers: true, childRooms: true, follows: true } },
      },
    });
    if (!room) return null;
    parentId = room.id;
  }
  return room;
}

export async function getRoomBySlug(slug: string) {
  return prisma.room.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, name: true } },
      curator: { select: { id: true, handle: true, name: true } },
      parentRoom: { select: { slug: true, name: true, id: true } },
      childRooms: { where: { status: "active" }, select: { slug: true, name: true, roomType: true } },
      _count: { select: { keepers: true, childRooms: true, follows: true } },
    },
  });
}

export async function getRoomByCategorySlug(categorySlug: string) {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });
  if (!category) return null;
  return prisma.room.findFirst({
    where: { categoryId: category.id },
    include: {
      category: { select: { slug: true, name: true } },
      curator: { select: { id: true, handle: true, name: true } },
      parentRoom: { select: { slug: true, name: true, id: true } },
      childRooms: { where: { status: "active" }, select: { slug: true, name: true, roomType: true } },
      _count: { select: { keepers: true, childRooms: true, follows: true } },
    },
  });
}

export async function requestRoom(
  userId: string,
  input: {
    slug: string;
    name: string;
    description?: string;
    roomType?: string;
    parentRoomId?: string;
    geoRelevanceNote?: string;
  }
) {
  if (input.roomType === "geo" && !input.geoRelevanceNote?.trim()) {
    throw new Error("Geographic rooms require a relevance note explaining local fit.");
  }

  const allowed = await canRequestRoom(userId);
  if (!allowed) {
    return prisma.room.create({
      data: {
        ...input,
        requesterId: userId,
        status: "pending",
      },
    });
  }

  const roomGate = await canCreateAnotherRoom(userId);
  if (!roomGate.ok) throw new Error(roomGate.error);

  return prisma.room
    .create({
      data: {
        ...input,
        curatorUserId: userId,
        requesterId: userId,
        status: "active",
      },
    })
    .then(async (room) => {
    await prisma.roomKeeper.upsert({
      where: { userId_roomId: { userId, roomId: room.id } },
      create: { userId, roomId: room.id, level: "keeper" },
      update: { level: "keeper", leveledUpAt: new Date() },
    });
    return room;
  });
}

export async function syncRoomsFromCategories(): Promise<number> {
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, description: true },
  });
  let created = 0;
  for (const cat of categories) {
    const existing = await prisma.room.findFirst({ where: { categoryId: cat.id } });
    if (existing) continue;
    await prisma.room.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        categoryId: cat.id,
        roomType: "category",
        status: "active",
      },
    });
    created++;
  }
  return created;
}
