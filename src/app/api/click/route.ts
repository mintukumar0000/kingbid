import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { emitLive } from "@/lib/events";

export const dynamic = "force-dynamic";

// Tracks an outbound click. Anti-fraud: 1 counted click per IP per listing
// per 5 minutes; rapid re-clicks are accepted but not counted.
export async function POST(request: Request) {
  let listingId: string | undefined;
  try {
    ({ listingId } = (await request.json()) as { listingId?: string });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const counted = rateLimit(`click:${listingId}:${ip}`, 1, 5 * 60_000);
  if (!counted) return NextResponse.json({ ok: true, counted: false });

  const ipHash = hashIp(ip);
  try {
    const [listing] = await prisma.$transaction([
      prisma.listing.update({
        where: { id: listingId },
        data: { clickCount: { increment: 1 } },
        select: { clickCount: true },
      }),
      prisma.click.create({ data: { listingId, ipHash } }),
      prisma.analytics.create({
        data: { event: "click", listingId, metadata: JSON.stringify({ ip: ipHash }) },
      }),
    ]);
    emitLive({ type: "click", listingId, clickCount: listing.clickCount });
    return NextResponse.json({ ok: true, counted: true, clickCount: listing.clickCount });
  } catch {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
}
