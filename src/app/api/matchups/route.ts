import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canShowOnPublicBoard } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  listingAId: z.string().uuid(),
  listingBId: z.string().uuid(),
});

/** Create a pending matchup — goes active only after both owners confirm. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid matchup data." }, { status: 400 });
  }

  if (parsed.data.listingAId === parsed.data.listingBId) {
    return NextResponse.json({ error: "Pick two different listings." }, { status: 400 });
  }

  const listings = await prisma.listing.findMany({
    where: {
      id: { in: [parsed.data.listingAId, parsed.data.listingBId] },
      status: "active",
      currentBid: { gt: 0 },
    },
    select: { id: true },
  });

  if (listings.length !== 2) {
    return NextResponse.json({ error: "Both listings must be active on the board." }, { status: 400 });
  }

  const matchup = await prisma.matchup.create({
    data: {
      listingAId: parsed.data.listingAId,
      listingBId: parsed.data.listingBId,
      status: "pending",
    },
  });

  return NextResponse.json({ id: matchup.id, status: matchup.status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const matchup = await prisma.matchup.findUnique({
    where: { id },
    include: {
      listingA: {
        select: { id: true, slug: true, title: true, displayUrl: true, currentBid: true, status: true },
      },
      listingB: {
        select: { id: true, slug: true, title: true, displayUrl: true, currentBid: true, status: true },
      },
      votes: { select: { votedForListingId: true } },
    },
  });

  if (!matchup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const aOk = canShowOnPublicBoard(matchup.listingA.status);
  const bOk = canShowOnPublicBoard(matchup.listingB.status);
  if (!aOk || !bOk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const votesA = matchup.votes.filter((v) => v.votedForListingId === matchup.listingAId).length;
  const votesB = matchup.votes.filter((v) => v.votedForListingId === matchup.listingBId).length;

  return NextResponse.json({
    id: matchup.id,
    status: matchup.status,
    ownerAConfirmed: matchup.ownerAConfirmed,
    ownerBConfirmed: matchup.ownerBConfirmed,
    listingA: matchup.listingA,
    listingB: matchup.listingB,
    votesA,
    votesB,
  });
}
