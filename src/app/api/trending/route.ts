import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseScope, resolveCountryCode } from "@/lib/geo";

export const dynamic = "force-dynamic";

// Top 5 listings by click velocity (clicks in the last hour).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = parseScope(searchParams.get("scope"));
  const countryCode = scope === "local" ? resolveCountryCode(request) : null;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const listingFilter =
    scope === "local" && countryCode
      ? { countryCode, localBid: { gt: 0 } }
      : { currentBid: { gt: 0 } };

  const eligible = await prisma.listing.findMany({
    where: listingFilter,
    select: { id: true },
  });
  const eligibleIds = eligible.map((l) => l.id);

  if (eligibleIds.length === 0) {
    return NextResponse.json({ trending: [], scope, countryCode });
  }

  const grouped = await prisma.click.groupBy({
    by: ["listingId"],
    where: { createdAt: { gte: oneHourAgo }, listingId: { in: eligibleIds } },
    _count: { _all: true },
    orderBy: { _count: { listingId: "desc" } },
    take: 5,
  });

  const listings = await prisma.listing.findMany({
    where: { id: { in: grouped.map((g) => g.listingId) } },
    select: {
      id: true,
      title: true,
      displayUrl: true,
      url: true,
      currentBid: true,
      localBid: true,
      countryCode: true,
    },
  });
  const byId = new Map(listings.map((l) => [l.id, l]));

  const trending = grouped
    .map((g) => {
      const l = byId.get(g.listingId);
      if (!l) return null;
      const bid = scope === "local" ? l.localBid : l.currentBid;
      return {
        id: l.id,
        title: l.title,
        displayUrl: l.displayUrl,
        url: l.url,
        currentBid: bid,
        countryCode: l.countryCode,
        clicksPerHour: g._count._all,
      };
    })
    .filter(Boolean);

  return NextResponse.json(
    { trending, scope, countryCode },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
