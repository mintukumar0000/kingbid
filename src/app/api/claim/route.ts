import { NextResponse } from "next/server";
import { z } from "zod";
import { handleBidRequest } from "@/lib/bid-request";
import { getInviteByToken, markInviteClaimed, validateInviteClaim } from "@/lib/invites";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10),
  url: z.string().min(1),
  title: z.string().min(1).max(80),
  email: z.string().email(),
  amount: z.number().int().min(5),
  alerts: z.boolean().optional(),
  categorySlug: z.string().nullable().optional(),
});

/** Invite claim → owner-submitted listing → checkout. Consent-only path. */
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

  const invite = await getInviteByToken(parsed.data.token);
  if (!invite || invite.status === "expired") {
    return NextResponse.json({ error: "Invite not found or expired." }, { status: 404 });
  }
  if (invite.status === "claimed") {
    return NextResponse.json({ error: "Invite already used." }, { status: 409 });
  }

  validateInviteClaim();

  let categorySlug: string | undefined;
  if (invite.category?.slug) {
    categorySlug = invite.category.slug;
  } else if (parsed.data.categorySlug) {
    categorySlug = parsed.data.categorySlug;
  }

  const bidRes = await handleBidRequest(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        url: parsed.data.url,
        title: parsed.data.title,
        email: parsed.data.email,
        amount: parsed.data.amount,
        scope: "global",
        ...(categorySlug ? { categorySlug } : {}),
      }),
    })
  );

  const bidData = await bidRes.json();
  if (!bidRes.ok) {
    return NextResponse.json(bidData, { status: bidRes.status });
  }

  await markInviteClaimed(parsed.data.token);

  if (parsed.data.alerts && bidData.paymentId) {
    const bid = await prisma.bid.findUnique({
      where: { paymentId: bidData.paymentId },
      select: { listingId: true },
    });
    if (bid) {
      await prisma.alertSubscription.create({
        data: { listingId: bid.listingId, contactMethod: parsed.data.email },
      });
    }
  }

  return NextResponse.json(bidData);
}
