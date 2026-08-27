// Email notifications via Resend. No-ops (with a console log) when
// RESEND_API_KEY is not configured, so local dev works without an account.

import { siteUrl, listingUrl } from "@/lib/site";
import { BRAND_LABEL, SITE_NAME } from "@/lib/brand";

const FROM = process.env.EMAIL_FROM ?? `${BRAND_LABEL} <onboarding@resend.dev>`;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:mock] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch (e) {
    console.error("[email] send failed:", e);
  }
}

export async function sendBidConfirmation(
  to: string,
  listingTitle: string,
  amount: number,
  total: number,
  opts?: { rank?: number | null; slug?: string; paymentId?: string }
): Promise<void> {
  const shareLink = opts?.paymentId
    ? `${siteUrl()}/success/${encodeURIComponent(opts.paymentId)}`
    : opts?.slug
      ? listingUrl(opts.slug)
      : siteUrl();
  const rankLine =
    opts?.rank != null ? `<p>You landed at <strong>#${opts.rank}</strong>.</p>` : "";

  await send(
    to,
    `Payment confirmed — ${listingTitle} is on the board`,
    `<p>Your payment of <strong>$${amount.toLocaleString()}</strong> is confirmed.</p>
     <p><strong>${listingTitle}</strong> now has a total bid of <strong>$${total.toLocaleString()}</strong>.</p>
     ${rankLine}
     <p><a href="${shareLink}">Share your rank →</a> · <a href="${siteUrl()}">Watch the board →</a></p>`
  );
}

export async function sendOutbidAlert(
  to: string,
  listingTitle: string,
  slug: string,
  claimPrice: number,
  newTopBid: number,
  rebidKey?: string
): Promise<void> {
  const rebidUrl = `${siteUrl()}/?rebid=${encodeURIComponent(rebidKey ?? slug)}&amount=${claimPrice}`;

  await send(
    to,
    `You've been outbid! ${listingTitle} lost the #1 spot`,
    `<p><strong>${listingTitle}</strong> just lost the #1 spot. The bid to beat is now <strong>$${newTopBid.toLocaleString()}</strong>.</p>
     <p>Reclaim #1 for <strong>$${claimPrice.toLocaleString()}</strong>:</p>
     <p><a href="${rebidUrl}" style="display:inline-block;padding:12px 24px;background:#e55b3c;color:#fff;text-decoration:none;border-radius:999px;font-weight:600">Reclaim #1 in one click →</a></p>
     <p style="color:#888;font-size:13px">Or visit <a href="${listingUrl(slug)}">your listing page</a> to share and earn referral credit.</p>`
  );
}

export async function sendReferralCreditEarned(
  to: string,
  listingTitle: string,
  creditBalance: number
): Promise<void> {
  await send(
    to,
    `You earned $1 referral credit — ${listingTitle}`,
    `<p>Someone bid via your shared link. You now have <strong>$${creditBalance.toLocaleString()}</strong> in credits toward your next raise.</p>
     <p><a href="${siteUrl()}">Use your credit →</a></p>`
  );
}

export interface DigestStats {
  totalRevenue: number;
  revenueWeek: number;
  totalListings: number;
  topMovers: { displayUrl: string; slug: string; rank: number; currentBid: number; bidDelta: number }[];
  lostTop: { displayUrl: string; slug: string; newTop: string; at: string }[];
}

export async function sendWeeklyDigest(to: string, stats: DigestStats): Promise<void> {
  const movers =
    stats.topMovers.length === 0
      ? "<p>No big movers this week.</p>"
      : `<ul>${stats.topMovers
          .map(
            (m) =>
              `<li><strong>${m.displayUrl}</strong> — #${m.rank} at $${m.currentBid.toLocaleString()} (+$${m.bidDelta.toLocaleString()} this week)</li>`
          )
          .join("")}</ul>`;

  const lost =
    stats.lostTop.length === 0
      ? ""
      : `<h3>Who lost #1</h3><ul>${stats.lostTop
          .map((l) => `<li>${l.displayUrl} was dethroned by ${l.newTop}</li>`)
          .join("")}</ul>`;

  await send(
    to,
    `${BRAND_LABEL} weekly — $${stats.revenueWeek.toLocaleString()} raised this week`,
    `<h2>This week on ${BRAND_LABEL}</h2>
     <p><strong>$${stats.revenueWeek.toLocaleString()}</strong> raised · <strong>$${stats.totalRevenue.toLocaleString()}</strong> all-time · ${stats.totalListings} listings</p>
     <h3>Top movers</h3>${movers}${lost}
     <p><a href="${siteUrl()}">See the live board →</a></p>
     <p style="color:#888;font-size:12px">You receive this because you bid on ${SITE_NAME}.</p>`
  );
}

export async function getDigestSubscribers(): Promise<string[]> {
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.bid.findMany({
    where: { status: "completed", email: { not: null } },
    distinct: ["email"],
    select: { email: true },
  });
  return rows.map((r) => r.email!).filter(Boolean);
}

export async function buildWeeklyDigestStats(): Promise<DigestStats> {
  const { prisma } = await import("@/lib/db");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [revenueAll, revenueWeek, totalListings, weekBids, listings] = await Promise.all([
    prisma.bid.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    prisma.bid.aggregate({
      where: { status: "completed", completedAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.listing.count({ where: { currentBid: { gt: 0 } } }),
    prisma.bid.findMany({
      where: { status: "completed", completedAt: { gte: weekAgo } },
      include: { listing: { select: { displayUrl: true, slug: true, currentBid: true } } },
    }),
    prisma.listing.findMany({
      where: { currentBid: { gt: 0 } },
      orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
      select: { id: true, displayUrl: true, slug: true, currentBid: true },
    }),
  ]);

  const deltaByListing = new Map<string, number>();
  for (const b of weekBids) {
    deltaByListing.set(b.listingId, (deltaByListing.get(b.listingId) ?? 0) + b.amount + b.creditApplied);
  }

  const rankById = new Map(listings.map((l, i) => [l.id, i + 1]));
  const topMovers = [...deltaByListing.entries()]
    .map(([id, bidDelta]) => {
      const l = listings.find((x) => x.id === id);
      if (!l) return null;
      return {
        displayUrl: l.displayUrl,
        slug: l.slug,
        rank: rankById.get(id) ?? 0,
        currentBid: l.currentBid,
        bidDelta,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.bidDelta - a!.bidDelta)
    .slice(0, 10) as DigestStats["topMovers"];

  const lostTopBids = await prisma.analytics.findMany({
    where: { event: "lost_top", createdAt: { gte: weekAgo } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const lostTop = lostTopBids.map((a) => {
    const meta = JSON.parse(a.metadata || "{}") as {
      displayUrl?: string;
      slug?: string;
      newTop?: string;
    };
    return {
      displayUrl: meta.displayUrl ?? "Someone",
      slug: meta.slug ?? "",
      newTop: meta.newTop ?? "a rival",
      at: a.createdAt.toISOString(),
    };
  });

  return {
    totalRevenue: revenueAll._sum.amount ?? 0,
    revenueWeek: revenueWeek._sum.amount ?? 0,
    totalListings,
    topMovers,
    lostTop,
  };
}
