import { NextResponse } from "next/server";
import { failBid } from "@/lib/bidding";
import { verifyDodoSignature } from "@/lib/dodo";
import { settlePayment } from "@/lib/settle";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/** Browser visits use GET — webhooks use POST from Dodo only. */
export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "dodo",
    message: "Webhook is live. Dodo sends POST here after checkout — do not open this URL to test payments.",
  });
}

// Dodo Payments webhook — fulfill ONLY on payment.succeeded (not browser redirect).
// Docs: https://docs.dodopayments.com/developer-resources/webhooks
export async function POST(request: Request) {
  const rawBody = await request.text();

  const valid = verifyDodoSignature(rawBody, {
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
    signature: request.headers.get("webhook-signature"),
  });
  if (!valid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: {
    type?: string;
    data?: { metadata?: Record<string, string> };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const paymentId = payload.data?.metadata?.paymentId;
  const metadata = payload.data?.metadata ?? {};

  if (payload.type === "payment.succeeded" && metadata.type === "subscription") {
    const subPaymentId = metadata.subscriptionPaymentId ?? paymentId;
    const userId = metadata.userId;
    const tier = metadata.tier as SubscriptionTier;
    if (subPaymentId && userId && tier) {
      try {
        await activateSubscriptionFromPayment(subPaymentId, userId, tier);
      } catch (e) {
        console.error("subscription activation failed:", e);
        return new NextResponse("Processing error", { status: 500 });
      }
    }
    return new NextResponse("OK", { status: 200 });
  }

  if (!paymentId) return new NextResponse("OK (no paymentId)", { status: 200 });

  try {
    if (payload.type === "payment.succeeded") {
      await settlePayment(paymentId);
    } else if (payload.type === "payment.failed" || payload.type === "payment.cancelled") {
      await failBid(paymentId);
    }
  } catch (e) {
    console.error("dodo webhook failed:", e);
    return new NextResponse("Processing error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
