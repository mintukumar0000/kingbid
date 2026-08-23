import { prisma } from "@/lib/db";

export const SUBSCRIPTION_TIERS = {
  founder_pro: { price: 19, label: "Founder Pro" },
  room_pro: { price: 29, label: "Room Pro" },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasTier(userId: string, tier: SubscriptionTier): Promise<boolean> {
  const sub = await getActiveSubscription(userId);
  return sub?.tier === tier && sub.status === "active";
}

export async function upsertSubscription(
  userId: string,
  tier: SubscriptionTier,
  dodoPaymentId: string,
  renewsAt: Date | null
): Promise<void> {
  await prisma.subscription.upsert({
    where: { dodoPaymentId },
    create: { userId, tier, dodoPaymentId, status: "active", renewsAt },
    update: { tier, status: "active", renewsAt },
  });
}

export async function activateSubscriptionFromPayment(
  dodoPaymentId: string,
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);
  await upsertSubscription(userId, tier, dodoPaymentId, renewsAt);
}

export async function cancelSubscription(dodoPaymentId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { dodoPaymentId },
    data: { status: "cancelled" },
  });
}

/** @deprecated use dodoPaymentId */
export async function cancelSubscriptionByStripe(stripeSubscriptionId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: "cancelled" },
  });
}
