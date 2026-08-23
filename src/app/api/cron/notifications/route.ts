import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { sendOutbidAlert } from "@/lib/email";
import { priceForTopSpot } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Game-style competitive alerts — rivals, dethroned, reign milestones. */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.notificationPreference.findMany({ take: 200 });
  let sent = 0;

  for (const pref of prefs) {
    const listing = await prisma.listing.findUnique({
      where: { id: pref.listingId },
      select: { title: true, slug: true, currentBid: true, boardId: true },
    });
    if (!listing) continue;

    if (pref.notifyOn === "rival_passed") {
      const rival = await prisma.rival.findFirst({
        where: { listingId: pref.listingId },
        include: { rivalListing: { select: { currentBid: true, title: true } } },
      });
      if (!rival) continue;
      const gap = rival.rivalListing.currentBid - listing.currentBid;
      if (gap > 0 && gap <= 20) {
        await sendOutbidAlert(
          pref.contactMethod,
          listing.title,
          listing.slug,
          priceForTopSpot(listing.currentBid),
          rival.rivalListing.currentBid
        );
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
