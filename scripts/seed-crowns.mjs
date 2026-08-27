/**
 * Seed 14 Digital Crown categories + boards.
 * Usage: node scripts/seed-crowns.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CROWN_CATEGORIES = [
  { slug: "king-of-ai", name: "King of AI", description: "KingBid digital crown — AI tools & agents." },
  { slug: "king-of-saas", name: "King of SaaS", description: "KingBid digital crown — SaaS products." },
  { slug: "king-of-startups", name: "King of Startups", description: "KingBid digital crown — startup products." },
  { slug: "king-of-developers", name: "King of Developers", description: "KingBid digital crown — developer tools." },
  { slug: "king-of-coding", name: "King of Coding", description: "KingBid digital crown — coding assistants." },
  { slug: "king-of-design", name: "King of Design", description: "KingBid digital crown — design tools." },
  { slug: "king-of-marketing", name: "King of Marketing", description: "KingBid digital crown — marketing & growth." },
  { slug: "king-of-x", name: "King of X", description: "KingBid digital crown — not affiliated with X Corp." },
  { slug: "king-of-threads", name: "King of Threads", description: "KingBid digital crown — not platform-endorsed." },
];

async function main() {
  for (const cat of CROWN_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { slug: cat.slug, name: cat.name, description: cat.description },
      update: { name: cat.name, description: cat.description },
    });
    const board = await prisma.board.findFirst({ where: { categoryId: category.id, region: null } });
    if (!board) await prisma.board.create({ data: { categoryId: category.id, region: null } });
  }

  const global = await prisma.board.findFirst({ where: { categoryId: null, region: null } });
  if (!global) await prisma.board.create({ data: { categoryId: null, region: null } });

  console.log(`Seeded ${CROWN_CATEGORIES.length} crown categories + global board.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
