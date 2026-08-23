import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  setSelfReportedRevenueBand,
  recordVerification,
  parseRevenueBandInput,
} from "@/lib/verification";
import { recomputeUnderdogForListing } from "@/lib/underdog";

export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string().uuid(),
  verificationType: z.enum(["domain", "founder", "revenue_band", "company"]),
  provider: z.string().optional(),
  revenueBand: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification data." }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, boardId: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  if (parsed.data.verificationType === "revenue_band") {
    const band = parsed.data.revenueBand ? parseRevenueBandInput(parsed.data.revenueBand) : null;
    if (!band) {
      return NextResponse.json({ error: "Invalid revenue band." }, { status: 400 });
    }
    await setSelfReportedRevenueBand(parsed.data.listingId, band);
    await recomputeUnderdogForListing(parsed.data.listingId, listing.boardId);
    return NextResponse.json({ ok: true, verified: false, band });
  }

  const band = parsed.data.revenueBand ? parseRevenueBandInput(parsed.data.revenueBand) : undefined;
  await recordVerification(
    parsed.data.listingId,
    parsed.data.verificationType,
    parsed.data.provider ?? null,
    band ?? undefined
  );

  return NextResponse.json({ ok: true, verified: true });
}
