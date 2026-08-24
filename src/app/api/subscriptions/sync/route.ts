import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateSessionUser, linkUserEmail } from "@/lib/users";
import { syncSubscriptionFromDodo } from "@/lib/dodo-sync";
import { getActiveSubscription, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

const schema = z.object({
  ourPaymentId: z.string().optional(),
  dodoPaymentId: z.string().optional(),
  tier: z.enum(["founder_pro", "room_pro"]).optional(),
  redirectStatus: z.string().optional(),
  email: z.string().email().optional(),
});

/** Poll + Dodo verify to activate Pro when webhook hasn't fired yet. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync request." }, { status: 400 });
  }

  const user = await getOrCreateSessionUser();
  if (parsed.data.email) {
    await linkUserEmail(user.id, parsed.data.email);
  }

  const result = await syncSubscriptionFromDodo({
    userId: user.id,
    ourPaymentId: parsed.data.ourPaymentId,
    dodoPaymentId: parsed.data.dodoPaymentId,
    tier: parsed.data.tier,
    redirectStatus: parsed.data.redirectStatus,
  });

  const sub = await getActiveSubscription(user.id);

  return NextResponse.json({
    sync: result,
    subscription: sub
      ? {
          tier: sub.tier,
          label: SUBSCRIPTION_TIERS[sub.tier as SubscriptionTier]?.label ?? sub.tier,
          status: sub.status,
          renewsAt: sub.renewsAt?.toISOString() ?? null,
        }
      : null,
    isPro: !!sub,
  });
}
