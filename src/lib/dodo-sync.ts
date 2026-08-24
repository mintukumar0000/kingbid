import { failBid } from "@/lib/bidding";
import { fetchDodoPayment } from "@/lib/dodo";
import { prisma } from "@/lib/db";
import { settlePayment } from "@/lib/settle";
import {
  activateSubscriptionFromPayment,
  getActiveSubscription,
  type SubscriptionTier,
} from "@/lib/subscriptions";

export type SyncResult = "completed" | "failed" | "pending" | "not_found";

/**
 * Fulfill a pending bid by checking Dodo directly — fallback when webhook is slow/missing.
 * Dodo redirects to /success/{ourPaymentId}?payment_id=pay_xxx after checkout.
 */
export async function syncPaymentFromDodo(
  ourPaymentId: string,
  dodoPaymentId?: string | null
): Promise<SyncResult> {
  const bid = await prisma.bid.findUnique({
    where: { paymentId: ourPaymentId },
    select: { status: true },
  });
  if (!bid) return "not_found";
  if (bid.status === "completed") return "completed";
  if (bid.status === "failed") return "failed";
  if (!dodoPaymentId?.trim()) return "pending";

  const payment = await fetchDodoPayment(dodoPaymentId.trim());
  if (!payment) return "pending";

  const metaPaymentId = payment.metadata?.paymentId;
  if (metaPaymentId && metaPaymentId !== ourPaymentId) {
    console.warn("dodo payment metadata mismatch", { metaPaymentId, ourPaymentId });
    return "pending";
  }

  const status = payment.status?.toLowerCase() ?? "";
  if (status === "succeeded") {
    await settlePayment(ourPaymentId);
    return "completed";
  }
  if (status === "failed" || status === "cancelled") {
    await failBid(ourPaymentId);
    return "failed";
  }

  return "pending";
}

/** Activate Pro when webhook is slow — uses Dodo API or trusted redirect status. */
export async function syncSubscriptionFromDodo(params: {
  userId: string;
  ourPaymentId?: string | null;
  dodoPaymentId?: string | null;
  tier?: SubscriptionTier | null;
  redirectStatus?: string | null;
}): Promise<SyncResult> {
  const active = await getActiveSubscription(params.userId);
  if (active) return "completed";

  let ourPaymentId = params.ourPaymentId?.trim() || null;

  if (!ourPaymentId && params.dodoPaymentId?.trim()) {
    const payment = await fetchDodoPayment(params.dodoPaymentId.trim());
    ourPaymentId =
      payment?.metadata?.subscriptionPaymentId ??
      payment?.metadata?.paymentId ??
      null;

    if (payment?.status?.toLowerCase() === "succeeded" && ourPaymentId) {
      const sub = await prisma.subscription.findFirst({ where: { dodoPaymentId: ourPaymentId } });
      if (sub) {
        await activateSubscriptionFromPayment(ourPaymentId, sub.userId, sub.tier as SubscriptionTier);
        return "completed";
      }
    }
  }

  let sub = ourPaymentId
    ? await prisma.subscription.findFirst({ where: { dodoPaymentId: ourPaymentId } })
    : null;

  if (!sub && params.tier) {
    sub = await prisma.subscription.findFirst({
      where: { userId: params.userId, tier: params.tier, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    ourPaymentId = sub?.dodoPaymentId ?? ourPaymentId;
  }

  if (!sub) return "not_found";
  if (sub.status === "active") return "completed";

  if (params.dodoPaymentId?.trim()) {
    const payment = await fetchDodoPayment(params.dodoPaymentId.trim());
    if (payment?.status?.toLowerCase() === "succeeded") {
      await activateSubscriptionFromPayment(sub.dodoPaymentId!, sub.userId, sub.tier as SubscriptionTier);
      return "completed";
    }
  }

  if (params.redirectStatus?.toLowerCase() === "active" && sub.dodoPaymentId) {
    await activateSubscriptionFromPayment(sub.dodoPaymentId, sub.userId, sub.tier as SubscriptionTier);
    return "completed";
  }

  return "pending";
}
