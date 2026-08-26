/**
 * One-off: clear test listings, reset launch clock, zero Nepal campaign ledger.
 * Usage: node scripts/reset-board.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date().toISOString();
  console.log("Resetting board at", now);

  await prisma.meta.upsert({
    where: { key: "launchedAt" },
    create: { key: "launchedAt", value: now },
    update: { value: now },
  });

  const nepal = await prisma.nepalCampaignPayment.deleteMany({});
  console.log("Deleted Nepal campaign payments:", nepal.count);

  const bids = await prisma.bid.deleteMany({});
  console.log("Deleted bids:", bids.count);

  const listings = await prisma.listing.updateMany({
    data: {
      currentBid: 0,
      localBid: 0,
      currentRank: null,
      clickCount: 0,
      creditBalance: 0,
      takeoverUntil: null,
    },
  });
  console.log("Reset listings:", listings.count);

  await prisma.reignHistory.deleteMany({});
  await prisma.underdogScore.deleteMany({});
  await prisma.platformEvent.deleteMany({});

  console.log("Done — board is empty, launch clock starts now.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
