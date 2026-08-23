import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOrCreateSessionUser, linkUserEmail } from "@/lib/users";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";
import { createDodoSubscriptionCheckout, isDodoConfigured } from "@/lib/dodo";
import { dodoCheckoutUserMessage } from "@/lib/dodo";

export const dynamic = "force-dynamic";

const schema = z.object({
  tier: z.enum(["founder_pro", "room_pro"]),
  email: z.string().email(),
});

export async function POST(request: Request) {
  if (!isDodoConfigured()) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription request." }, { status: 400 });
  }

  const user = await getOrCreateSessionUser();
  await linkUserEmail(user.id, parsed.data.email);

  const tier = parsed.data.tier as SubscriptionTier;
  const paymentId = `sub_${crypto.randomUUID().replace(/-/g, "")}`;
  const amount = SUBSCRIPTION_TIERS[tier].price;

  await prisma.subscription.create({
    data: {
      userId: user.id,
      tier,
      dodoPaymentId: paymentId,
      status: "pending",
    },
  });

  try {
    const checkoutUrl = await createDodoSubscriptionCheckout({
      paymentId,
      tier,
      amountDollars: amount,
      email: parsed.data.email,
      userId: user.id,
    });
    return NextResponse.json({ checkoutUrl, paymentId, tier, amount });
  } catch (e) {
    await prisma.subscription.deleteMany({ where: { dodoPaymentId: paymentId } });
    const err = e as Error & { dodoStatus?: number; dodoBody?: string };
    if (err.dodoStatus) {
      return NextResponse.json(
        { error: dodoCheckoutUserMessage(err.dodoStatus, err.dodoBody ?? "") },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: err.message ?? "Could not start checkout." },
      { status: 502 }
    );
  }
}

export async function GET() {
  const user = await getOrCreateSessionUser();
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscription: sub });
}
