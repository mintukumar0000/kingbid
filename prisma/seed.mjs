// Default seed — real stats only. Sets launch time; no fake listings or visitors.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.meta.upsert({
    where: { key: "launchedAt" },
    create: { key: "launchedAt", value: new Date().toISOString() },
    update: {},
  });
  console.log("Seed complete — launch metadata only. Run npm run db:seed:demo for sample listings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
