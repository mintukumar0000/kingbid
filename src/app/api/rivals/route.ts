import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOrCreateSessionUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const MAX_RIVALS = 5;

const schema = z.object({
  listingSlug: z.string().min(1),
  rivalSlug: z.string().min(1),
});

export async function GET() {
  const user = await getOrCreateSessionUser();
  const rivals = await prisma.rival.findMany({
    where: { userId: user.id },
    include: {
      listing: { select: { slug: true, displayUrl: true, title: true, currentBid: true } },
      rivalListing: { select: { slug: true, displayUrl: true, title: true, currentBid: true } },
    },
  });
  return NextResponse.json({
    rivals: rivals.map((r) => ({
      id: r.id,
      yours: r.listing,
      rival: r.rivalListing,
      gap: r.listing.currentBid - r.rivalListing.currentBid,
      gapLabel:
        r.listing.currentBid >= r.rivalListing.currentBid
          ? `You're $${r.listing.currentBid - r.rivalListing.currentBid} ahead`
          : `You're $${r.rivalListing.currentBid - r.listing.currentBid} away from passing them`,
    })),
  });
}

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
    return NextResponse.json({ error: "listingSlug and rivalSlug required." }, { status: 400 });
  }

  const [listing, rival] = await Promise.all([
    prisma.listing.findUnique({ where: { slug: parsed.data.listingSlug.toLowerCase() } }),
    prisma.listing.findUnique({ where: { slug: parsed.data.rivalSlug.toLowerCase() } }),
  ]);
  if (!listing || !rival) {
    return NextResponse.json({ error: "Listing or rival not found." }, { status: 404 });
  }

  const count = await prisma.rival.count({
    where: { userId: user.id, listingId: listing.id },
  });
  if (count >= MAX_RIVALS) {
    return NextResponse.json({ error: `Max ${MAX_RIVALS} rivals per listing.` }, { status: 400 });
  }

  const row = await prisma.rival.create({
    data: {
      userId: user.id,
      listingId: listing.id,
      rivalListingId: rival.id,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(request: Request) {
  const user = await getOrCreateSessionUser();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.rival.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
