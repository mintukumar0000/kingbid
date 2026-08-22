// Dodo Payments — Merchant of Record with dynamic (pay-what-you-want) checkout.
// Docs: https://docs.dodopayments.com/developer-resources/dynamic-pricing-checkout

import { createHmac, timingSafeEqual } from "crypto";
import type { CheckoutParams } from "@/lib/payments";

function apiBase(): string {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function isDodoConfigured(): boolean {
  return !!process.env.DODO_PAYMENTS_API_KEY;
}

export async function createDodoCheckout(params: CheckoutParams): Promise<string> {
  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!productId || !apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY and DODO_PAYMENTS_PRODUCT_ID are required.");
  }

  // Force USD so US test cards (4242…) work. Without this, Nepal/IN users often
  // see NPR/INR checkout where US test cards are declined.
  const billingCurrency = process.env.DODO_BILLING_CURRENCY ?? "USD";

  const res = await fetch(`${apiBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: params.amount * 100, // cents for USD PWYW product
        },
      ],
      billing_currency: billingCurrency,
      allowed_payment_method_types: ["credit", "debit"],
      return_url: `${siteUrl()}/success/${encodeURIComponent(params.paymentId)}`,
      customer: params.email ? { email: params.email } : undefined,
      metadata: {
        paymentId: params.paymentId,
        listingUrl: params.listingUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dodo checkout failed (${res.status}): ${body}`);
  }

  const session = (await res.json()) as { checkout_url?: string; checkoutUrl?: string };
  const url = session.checkout_url ?? session.checkoutUrl;
  if (!url) throw new Error("Dodo checkout response missing checkout_url");
  return url;
}

/** Standard Webhooks signature verification (same scheme as Polar). */
export function verifyDodoSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null }
): boolean {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
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
