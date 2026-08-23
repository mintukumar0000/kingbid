import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "kb_vote_session";

async function voterSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = randomBytes(16).toString("hex");
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

const voteSchema = z.object({
  votedForListingId: z.string().uuid(),
});

/** One vote per session per matchup — real tally only. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const matchup = await prisma.matchup.findUnique({ where: { id } });
  if (!matchup || matchup.status !== "active") {
    return NextResponse.json({ error: "Matchup not active." }, { status: 400 });
  }

  const validIds = [matchup.listingAId, matchup.listingBId];
  if (!validIds.includes(parsed.data.votedForListingId)) {
    return NextResponse.json({ error: "Invalid choice." }, { status: 400 });
  }

  const sessionId = await voterSessionId();

  try {
    await prisma.matchupVote.create({
      data: {
        matchupId: id,
        voterSessionId: sessionId,
        votedForListingId: parsed.data.votedForListingId,
      },
    });
  } catch {
    return NextResponse.json({ error: "You already voted in this matchup." }, { status: 409 });
  }

  const votes = await prisma.matchupVote.groupBy({
    by: ["votedForListingId"],
    where: { matchupId: id },
    _count: { _all: true },
  });

  return NextResponse.json({
    ok: true,
    votes: Object.fromEntries(votes.map((v) => [v.votedForListingId, v._count._all])),
  });
}

const confirmSchema = z.object({
  listingId: z.string().uuid(),
});

/** Owner confirms participation — both must confirm before status → active. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid confirm." }, { status: 400 });
  }

  const matchup = await prisma.matchup.findUnique({ where: { id } });
  if (!matchup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isA = parsed.data.listingId === matchup.listingAId;
  const isB = parsed.data.listingId === matchup.listingBId;
  if (!isA && !isB) {
    return NextResponse.json({ error: "Listing not in this matchup." }, { status: 400 });
  }

  const updated = await prisma.matchup.update({
    where: { id },
    data: {
      ...(isA ? { ownerAConfirmed: true } : { ownerBConfirmed: true }),
    },
  });

  const bothConfirmed = updated.ownerAConfirmed && updated.ownerBConfirmed;
  if (bothConfirmed && updated.status === "pending") {
    await prisma.matchup.update({
      where: { id },
      data: { status: "active" },
    });
  }

  return NextResponse.json({
    ownerAConfirmed: updated.ownerAConfirmed,
    ownerBConfirmed: updated.ownerBConfirmed,
    status: bothConfirmed ? "active" : updated.status,
  });
}
