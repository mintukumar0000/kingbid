// Backfill slug + new bid columns for existing databases.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugFromDisplayUrl(displayUrl, handle) {
  if (handle) return handle.replace(/^@/, "").toLowerCase();
  const base = displayUrl.toLowerCase().replace(/^@/, "").split(" on ")[0] ?? displayUrl;
  return base
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const listings = await prisma.listing.findMany();
  const used = new Set(listings.map((l) => l.slug).filter(Boolean));

  for (const listing of listings) {
    if (listing.slug) continue;
    let base = slugFromDisplayUrl(listing.displayUrl, listing.handle);
    let slug = base || "listing";
    let n = 0;
    while (used.has(slug)) {
      n += 1;
      slug = `${base}-${n}`;
    }
    used.add(slug);
    await prisma.listing.update({ where: { id: listing.id }, data: { slug } });
    console.log(`slug: ${listing.displayUrl} → ${slug}`);
  }

  await prisma.bid.updateMany({
    where: { bidIncrease: 0 },
    data: {},
  });

  const bids = await prisma.bid.findMany({ where: { bidIncrease: 0 } });
  for (const bid of bids) {
    await prisma.bid.update({
      where: { id: bid.id },
      data: { bidIncrease: bid.amount + bid.creditApplied },
    });
  }

  console.log("Backfill complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
