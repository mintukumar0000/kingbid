import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function checkPassword(provided: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`admin:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [recentBids, pendingCount, failedCount, revenue, listings] = await Promise.all([
    prisma.bid.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { listing: { select: { title: true, displayUrl: true, url: true } } },
    }),
    prisma.bid.count({ where: { status: "pending" } }),
    prisma.bid.count({ where: { status: "failed" } }),
    prisma.bid.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    prisma.listing.count(),
  ]);

  return NextResponse.json({
    revenue: revenue._sum.amount ?? 0,
    pendingCount,
    failedCount,
    totalListings: listings,
    recentBids: recentBids.map((b) => ({
      id: b.id,
      listing: b.listing.title,
      displayUrl: b.listing.displayUrl,
      amount: b.amount,
      totalAfter: b.totalAfter,
      status: b.status,
      isTakeover: b.isTakeover,
      email: b.email,
      paymentId: b.paymentId,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

// DELETE removes a listing that violates the rules (admin moderation).
export async function DELETE(request: Request) {
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  await prisma.$transaction([
    prisma.click.deleteMany({ where: { listingId } }),
    prisma.bid.deleteMany({ where: { listingId } }),
    prisma.listing.delete({ where: { id: listingId } }),
  ]);
  return NextResponse.json({ ok: true });
}
