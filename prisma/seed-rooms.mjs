/** Sync v1 categories → v2 rooms table. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
    console.log(`Room: ${cat.slug}`);
  }
  console.log(`Done — ${created} rooms created.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
