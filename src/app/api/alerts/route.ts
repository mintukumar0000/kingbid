import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canShowOnPublicBoard } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  listingSlug: z.string().min(1).max(100),
});

/** Opt in or out of outbid alerts for a listing you own. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { slug: parsed.data.listingSlug.toLowerCase() },
    select: { id: true, ownerEmail: true, ownerContact: true, status: true },
  });

  if (!listing || !canShowOnPublicBoard(listing.status)) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const owns =
    listing.ownerEmail?.toLowerCase() === email ||
    listing.ownerContact?.toLowerCase() === email;

  if (!owns) {
    return NextResponse.json(
      { error: "Email must match the address used when you listed." },
      { status: 403 }
    );
  }

  const existing = await prisma.alertSubscription.findFirst({
    where: { listingId: listing.id, contactMethod: email },
  });

  if (existing) {
    await prisma.alertSubscription.delete({ where: { id: existing.id } });
    return NextResponse.json({ subscribed: false });
  }

  await prisma.alertSubscription.create({
    data: { listingId: listing.id, contactMethod: email },
  });

  return NextResponse.json({ subscribed: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const slug = searchParams.get("slug")?.trim().toLowerCase();

  if (!email || !slug) {
    return NextResponse.json({ error: "email and slug required." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true, ownerEmail: true, ownerContact: true, displayUrl: true, title: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const owns =
    listing.ownerEmail?.toLowerCase() === email ||
    listing.ownerContact?.toLowerCase() === email;

  if (!owns) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const sub = await prisma.alertSubscription.findFirst({
    where: { listingId: listing.id, contactMethod: email },
  });

  return NextResponse.json({
    listing: { slug, displayUrl: listing.displayUrl, title: listing.title },
    subscribed: !!sub,
  });
}
