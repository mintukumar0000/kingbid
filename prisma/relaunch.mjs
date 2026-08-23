/**
 * Fresh relaunch: remove a listing + reset launch timestamp in meta.
 * Usage: node prisma/relaunch.mjs [--url=writenaturallyai.com] [--hours=1]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const urlNeedle = process.argv.find((a) => a.startsWith("--url="))?.slice(6) ?? "writenaturallyai.com";
const hoursAgo = Number(process.argv.find((a) => a.startsWith("--hours="))?.slice(8) ?? "1");

async function removeListing(listingId) {
  await prisma.matchupVote.deleteMany({
    where: { matchup: { OR: [{ listingAId: listingId }, { listingBId: listingId }] } },
  });
  await prisma.matchup.deleteMany({
    where: { OR: [{ listingAId: listingId }, { listingBId: listingId }] },
  });
  await prisma.badgeEmbed.deleteMany({ where: { listingId } });
  await prisma.alertSubscription.deleteMany({ where: { listingId } });
  await prisma.reignHistory.deleteMany({ where: { listingId } });
  await prisma.click.deleteMany({ where: { listingId } });
  await prisma.bid.deleteMany({
    where: { OR: [{ listingId }, { referralListingId: listingId }] },
  });
  await prisma.listing.delete({ where: { id: listingId } });
}

async function main() {
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [
        { url: { contains: urlNeedle, mode: "insensitive" } },
        { displayUrl: { contains: urlNeedle, mode: "insensitive" } },
      ],
    },
  });

  if (listing) {
    console.log(`Removing listing: ${listing.displayUrl} (${listing.id})`);
    await removeListing(listing.id);
    console.log("Listing removed.");
  } else {
    console.log(`No listing matched "${urlNeedle}" — skipping removal.`);
  }

  const launchedAt = new Date(Date.now() - hoursAgo * 3_600_000);
  const iso = launchedAt.toISOString();
  await prisma.meta.upsert({
    where: { key: "launchedAt" },
    create: { key: "launchedAt", value: iso },
    update: { value: iso },
  });

  const remaining = await prisma.listing.count({ where: { status: "active" } });
  const visitors = await prisma.visitor.count();

  console.log(`Launch reset to ${iso} (${hoursAgo} hour(s) ago).`);
  console.log(`Active listings: ${remaining}`);
  console.log(`Visitors (unchanged): ${visitors}`);
  console.log(`\nSet Vercel LAUNCHED_AT=${iso} on Production, then redeploy.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
