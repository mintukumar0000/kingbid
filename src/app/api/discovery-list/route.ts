import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOrCreateSessionUser, bumpKingbidScore } from "@/lib/users";
import { addDiscoveryBet, getDiscoveryList } from "@/lib/kingmaker";
import { resolveListingInput } from "@/lib/resolve-listing";
import { evaluateKeeperLevel, getKeeperQuotas } from "@/lib/keepers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateSessionUser();
  const [list, quotas] = await Promise.all([getDiscoveryList(user.id), getKeeperQuotas(user.id)]);
  return NextResponse.json({
    bets: list.map((d) => ({
      listingId: d.listingId,
      slug: d.listing.slug,
      displayUrl: d.listing.displayUrl,
      title: d.listing.title,
      currentBid: d.listing.currentBid,
      calledAt: d.calledAt.toISOString(),
    })),
    remaining: quotas.discoveryRemaining,
    limit: quotas.discoveryLimit,
    level: quotas.level,
    used: quotas.discoveryUsed,
  });
}

const schema = z.object({
  listingSlug: z.string().min(1),
});

/** Kingmaker "10 bets" — free, reputation only. */
export async function POST(request: Request) {
  const user = await getOrCreateSessionUser();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "listingSlug required." }, { status: 400 });
  }

  const listing = await resolveListingInput(parsed.data.listingSlug);
  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found. Use an exact slug from the leaderboard, or claim your product first." },
      { status: 404 }
    );
  }

  try {
    await addDiscoveryBet(user.id, listing.id);
    await bumpKingbidScore(user.id, 1, "discovery_bet");

    const listingBoard = await prisma.listing.findUnique({
      where: { id: listing.id },
      select: { board: { select: { categoryId: true } } },
    });
    if (listingBoard?.board?.categoryId) {
      const room = await prisma.room.findFirst({
        where: { categoryId: listingBoard.board.categoryId },
        select: { id: true },
      });
      if (room) await evaluateKeeperLevel(user.id, room.id);
    }
    const fallbackRoom = await prisma.room.findFirst({
      where: { status: "active" },
      select: { id: true },
    });
    if (fallbackRoom) await evaluateKeeperLevel(user.id, fallbackRoom.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getOrCreateSessionUser();
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { slug: slug.toLowerCase() } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.discoveryList.deleteMany({
    where: { userId: user.id, listingId: listing.id },
  });
  return NextResponse.json({ ok: true });
}
