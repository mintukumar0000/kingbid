// Shared handler for POST /api/bids and POST /api/listings.

import { NextResponse } from "next/server";
import { z } from "zod";
import { BidError, createBidIntent } from "@/lib/bidding";
import { createCheckout } from "@/lib/payments";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { resolveReferralSlug, referralCookieName } from "@/lib/referral";
import { parseScope, resolveCountryCode } from "@/lib/geo";

const bidSchema = z.object({
  url: z.string().min(1).max(500),
  amount: z.number().int().min(1).max(999_999),
  title: z.string().max(80).optional(),
  description: z.string().max(200).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  isTakeover: z.boolean().optional(),
  referralSlug: z.string().max(100).optional(),
  scope: z.enum(["global", "local"]).optional(),
  countryCode: z.string().length(2).optional(),
});

function referralFromRequest(request: Request, bodySlug?: string): string | null {
  if (bodySlug) return bodySlug;
  const cookie = request.headers.get("cookie") ?? "";
  const name = referralCookieName();
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function handleBidRequest(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);

  if (!rateLimit(`bid:${ip}`, 5, 60_000) || !rateLimit(`bid-hour:${ip}`, 20, 3_600_000)) {
    return NextResponse.json({ error: "Too many bid attempts. Slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const referralSlug = referralFromRequest(request, parsed.data.referralSlug);
  const referralListingId = await resolveReferralSlug(referralSlug);
  const scope = parseScope(parsed.data.scope);
  const countryCode =
    scope === "local"
      ? (parsed.data.countryCode?.toUpperCase() ?? resolveCountryCode(request))
      : null;

  try {
    const intent = await createBidIntent({
      rawUrl: parsed.data.url,
      amount: parsed.data.amount,
      title: parsed.data.title,
      description: parsed.data.description,
      email: parsed.data.email || undefined,
      isTakeover: parsed.data.isTakeover,
      referralListingId,
      scope,
      countryCode,
    });

    const checkoutUrl = await createCheckout({
      paymentId: intent.paymentId,
      amount: intent.amount,
      listingUrl: intent.listingUrl,
      displayUrl: intent.displayUrl,
      email: parsed.data.email || undefined,
    });

    await prisma.analytics.create({
      data: {
        event: "checkout_started",
        metadata: JSON.stringify({
          amount: intent.amount,
          creditApplied: intent.creditApplied,
          url: intent.listingUrl,
          ip: hashIp(ip),
          referralSlug,
        }),
      },
    });

    return NextResponse.json({
      checkoutUrl,
      paymentId: intent.paymentId,
      amount: intent.amount,
      creditApplied: intent.creditApplied,
      totalAfter: intent.totalAfterEstimate,
      isNewListing: intent.isNewListing,
    });
  } catch (e) {
    if (e instanceof BidError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("bid request failed:", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
