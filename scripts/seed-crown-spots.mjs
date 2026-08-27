/**
 * Seed 21 KingBid flagship crown spot boards.
 * Usage: node scripts/seed-crown-spots.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPOTS = [
  { slug: "kingbid-spot-01", name: "Crown Owner", description: "Own the KingBid Crown — the king emblem." },
  { slug: "kingbid-spot-02", name: "Diamond 01 — Front", description: "Front royal gem on the crown." },
  { slug: "kingbid-spot-03", name: "Diamond 02 — Left", description: "Left royal gem on the crown." },
  { slug: "kingbid-spot-04", name: "Diamond 03 — Right", description: "Right royal gem on the crown." },
  { slug: "kingbid-spot-05", name: "Diamond 04 — Back", description: "Back royal gem on the crown." },
  ...Array.from({ length: 8 }, (_, i) => ({
    slug: `kingbid-spot-${String(6 + i).padStart(2, "0")}`,
    name: `Royal Panel #${String(i + 1).padStart(2, "0")}`,
    description: `Royal panel ${String(i + 1).padStart(2, "0")} on the KingBid crown.`,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    slug: `kingbid-spot-${String(14 + i).padStart(2, "0")}`,
    name: `Court Spot #${String(i + 1).padStart(2, "0")}`,
    description: `Court spot ${String(i + 1).padStart(2, "0")} on the KingBid crown.`,
  })),
];

async function main() {
  for (const spot of SPOTS) {
    const category = await prisma.category.upsert({
      where: { slug: spot.slug },
      create: { slug: spot.slug, name: spot.name, description: spot.description },
      update: { name: spot.name, description: spot.description },
    });
    const board = await prisma.board.findFirst({ where: { categoryId: category.id, region: null } });
    if (!board) await prisma.board.create({ data: { categoryId: category.id, region: null } });
  }
  console.log(`Seeded ${SPOTS.length} KingBid crown spot boards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
