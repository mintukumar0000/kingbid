import { prisma } from "@/lib/db";
import { canRequestRoom } from "@/lib/keepers";

export async function getRoomBySlug(slug: string) {
  return prisma.room.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, name: true } },
      curator: { select: { id: true, handle: true, name: true } },
      parentRoom: { select: { slug: true, name: true } },
      _count: { select: { keepers: true, childRooms: true } },
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
      parentRoom: { select: { slug: true, name: true } },
      _count: { select: { keepers: true, childRooms: true } },
    },
  });
}

export async function requestRoom(
  userId: string,
  input: { slug: string; name: string; description?: string; roomType?: string; parentRoomId?: string }
) {
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
  return prisma.room.create({
    data: {
      ...input,
      curatorUserId: userId,
      requesterId: userId,
      status: "active",
    },
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
