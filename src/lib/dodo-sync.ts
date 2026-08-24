import { failBid } from "@/lib/bidding";
import { fetchDodoPayment } from "@/lib/dodo";
import { prisma } from "@/lib/db";
import { settlePayment } from "@/lib/settle";

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
