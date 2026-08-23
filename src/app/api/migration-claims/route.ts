import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string().uuid(),
  claimedPreviousPlatform: z.string().min(2).max(80),
  evidenceUrl: z.string().url().optional(),
  badge: z.enum(["founding_migrator", "founding_competitor"]),
});

/** Self-reported migration badge — not an official data import. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid claim data." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const claim = await prisma.migrationClaim.upsert({
    where: { listingId: parsed.data.listingId },
    create: parsed.data,
    update: {
      claimedPreviousPlatform: parsed.data.claimedPreviousPlatform,
      evidenceUrl: parsed.data.evidenceUrl ?? null,
      badge: parsed.data.badge,
    },
  });

  return NextResponse.json({ ok: true, claim });
}

export async function GET(request: Request) {
  const listingId = new URL(request.url).searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const claim = await prisma.migrationClaim.findUnique({ where: { listingId } });
  return NextResponse.json({ claim });
}
