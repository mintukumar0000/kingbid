import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { canShowOnPublicBoard } from "@/lib/guardrails";
import { outboundUrl } from "@/lib/format";
import { emitLive } from "@/lib/events";

export const dynamic = "force-dynamic";

/** Log click → 302 to destination. Makes click stats auditable. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { url: true, status: true, clickCount: true },
  });

  if (!listing || !canShowOnPublicBoard(listing.status)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = getClientIp(request);
  const referrer = request.headers.get("referer");
  const counted = rateLimit(`click:${listingId}:${ip}`, 1, 5 * 60_000);

  if (counted) {
    const ipHash = hashIp(ip);
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.listing.update({
          where: { id: listingId },
          data: { clickCount: { increment: 1 } },
          select: { clickCount: true },
        });
        await tx.click.create({
          data: { listingId, ipHash, referrer: referrer?.slice(0, 500) ?? null },
        });
        return row;
      });
      emitLive({ type: "click", listingId, clickCount: updated.clickCount });
    } catch {
      /* still redirect */
    }
  }

  return NextResponse.redirect(outboundUrl(listing.url), 302);
}
