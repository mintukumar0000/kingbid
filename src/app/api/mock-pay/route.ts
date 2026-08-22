import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMockPayments } from "@/lib/payments";
import { failBid } from "@/lib/bidding";
import { settlePayment } from "@/lib/settle";

export const dynamic = "force-dynamic";

// Local-dev-only endpoint that simulates the Polar webhook. Disabled entirely
// when a real POLAR_ACCESS_TOKEN is configured.
export async function POST(request: Request) {
  if (!isMockPayments()) {
    return NextResponse.json({ error: "Mock payments are disabled in production." }, { status: 403 });
  }

  let body: { paymentId?: string; outcome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { paymentId, outcome } = body;
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: true },
  });
  if (!bid) return NextResponse.json({ error: "Unknown payment" }, { status: 404 });

  if (outcome === "fail") {
    await failBid(paymentId);
    return NextResponse.json({ ok: true, status: "failed" });
  }

  await settlePayment(paymentId);
  const updated = await prisma.bid.findUnique({ where: { paymentId }, include: { listing: true } });
  return NextResponse.json({
    ok: true,
    status: "completed",
    listingTitle: updated?.listing.title,
    listingUrl: updated?.listing.url,
    displayUrl: updated?.listing.displayUrl,
    amount: updated?.amount,
    totalAfter: updated?.totalAfter,
  });
}

// GET returns checkout details for the mock checkout page.
export async function GET(request: Request) {
  if (!isMockPayments()) {
    return NextResponse.json({ error: "Mock payments are disabled." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment");
  if (!paymentId) return NextResponse.json({ error: "payment required" }, { status: 400 });

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: true },
  });
  if (!bid) return NextResponse.json({ error: "Unknown payment" }, { status: 404 });

  return NextResponse.json({
    paymentId,
    amount: bid.amount,
    status: bid.status,
    isTakeover: bid.isTakeover,
    listingTitle: bid.listing.title,
    displayUrl: bid.listing.displayUrl,
  });
}
