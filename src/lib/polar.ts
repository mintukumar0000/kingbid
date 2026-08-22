// Payment layer.
//
// - When POLAR_ACCESS_TOKEN is set: creates a real Polar.sh checkout
//   (Polar is a Merchant of Record, so global sales tax is handled).
// - When it is NOT set (local dev): returns a URL to the built-in mock
//   checkout page (/checkout/mock) which simulates a successful payment
//   end-to-end, including the webhook confirmation path.

import { createHmac, timingSafeEqual } from "crypto";

const POLAR_API = process.env.POLAR_API_URL ?? "https://api.polar.sh/v1";

export function isPolarConfigured(): boolean {
  return !!process.env.POLAR_ACCESS_TOKEN;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export interface CheckoutParams {
  paymentId: string; // our internal payment reference stored on the Bid
  amount: number; // whole dollars
  listingUrl: string;
  displayUrl: string;
  email?: string;
}

export async function createPolarCheckout(params: CheckoutParams): Promise<string> {
  const res = await fetch(`${POLAR_API}/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products: [process.env.POLAR_PRODUCT_ID],
      amount: params.amount * 100, // Polar uses cents (pay-what-you-want product)
      customer_email: params.email || undefined,
      metadata: {
        paymentId: params.paymentId,
        listingUrl: params.listingUrl,
      },
      success_url: `${siteUrl()}/success/${encodeURIComponent(params.paymentId)}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polar checkout failed (${res.status}): ${body}`);
  }
  const checkout = (await res.json()) as { url: string };
  return checkout.url;
}

/**
 * Verifies a Polar webhook (Standard Webhooks spec):
 * HMAC-SHA256 of "{id}.{timestamp}.{payload}" with the base64 webhook secret.
 */
export function verifyPolarSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null }
): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  return headers.signature.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expected, "base64");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}
