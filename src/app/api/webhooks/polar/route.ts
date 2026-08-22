import { NextResponse } from "next/server";
import { failBid } from "@/lib/bidding";
import { verifyPolarSignature } from "@/lib/polar";
import { settlePayment } from "@/lib/settle";

export const dynamic = "force-dynamic";

// Polar payment webhook (Standard Webhooks signature scheme).
export async function POST(request: Request) {
  const rawBody = await request.text();

  const valid = verifyPolarSignature(rawBody, {
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
    signature: request.headers.get("webhook-signature"),
  });
  if (!valid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: { type?: string; data?: { metadata?: Record<string, string>; status?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const paymentId = payload.data?.metadata?.paymentId;
  if (!paymentId) return new NextResponse("OK (no paymentId)", { status: 200 });

  try {
    if (
      (payload.type === "checkout.updated" && payload.data?.status === "succeeded") ||
      payload.type === "order.created" ||
      payload.type === "checkout.completed"
    ) {
      await settlePayment(paymentId);
    } else if (payload.data?.status === "failed" || payload.data?.status === "expired") {
      await failBid(paymentId);
    }
  } catch (e) {
    console.error("webhook processing failed:", e);
    // Return 500 so Polar retries delivery
    return new NextResponse("Processing error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
