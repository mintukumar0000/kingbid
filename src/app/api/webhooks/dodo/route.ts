import { NextResponse } from "next/server";
import { failBid } from "@/lib/bidding";
import { verifyDodoSignature } from "@/lib/dodo";
import { settlePayment } from "@/lib/settle";

export const dynamic = "force-dynamic";

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
