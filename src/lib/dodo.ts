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

export function isDodoLiveMode(): boolean {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";
}

/** Map Dodo API failures to a short user-facing checkout error. */
export function dodoCheckoutUserMessage(status: number, body: string): string {
  if (status === 401) {
    return "Checkout is unavailable — live payment keys may not match. Check Dodo live API key on Vercel.";
  }
  if (status === 422) {
    if (/product/i.test(body)) {
      return "Checkout product is not set up in Dodo live mode. Confirm the live product ID on Vercel.";
    }
    return "Could not start checkout for this bid amount. Try a different amount.";
  }
  if (status === 404) {
    return "Payment product not found in Dodo. Confirm DODO_PAYMENTS_PRODUCT_ID for live mode.";
  }
  return "Could not start checkout. Please try again in a moment.";
}

export async function createDodoCheckout(params: CheckoutParams): Promise<string> {
  const productId = params.productId ?? process.env.DODO_PAYMENTS_PRODUCT_ID;
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!productId || !apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY and product ID are required.");
  }

  if (params.amount < 1) {
    throw new Error("Nothing to charge — referral credit may cover this raise. Contact support.");
  }

  // Adaptive currency + billing country are handled entirely on Dodo checkout
  // (IP detection, country dropdown, Pay in NPR/USD/INR). Do not prefill billing_address
  // — that can lock the country field and block international cards in test/live mode.
  const billingCurrency = process.env.DODO_BILLING_CURRENCY?.trim();

  const payload: Record<string, unknown> = {
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: params.amount * 100, // USD cents on PWYW product; Dodo converts at checkout
      },
    ],
    allowed_payment_method_types: ["credit", "debit"],
    return_url: params.returnUrl ?? `${siteUrl()}/success/${encodeURIComponent(params.paymentId)}`,
    customer: params.email ? { email: params.email } : undefined,
    metadata: {
      paymentId: params.paymentId,
      listingUrl: params.listingUrl,
      ...params.metadata,
    },
  };

  if (billingCurrency) payload.billing_currency = billingCurrency;

  const res = await fetch(`${apiBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Dodo checkout failed (${res.status}): ${body}`) as Error & {
      dodoStatus?: number;
      dodoBody?: string;
    };
    err.dodoStatus = res.status;
    err.dodoBody = body;
    throw err;
  }

  const session = (await res.json()) as { checkout_url?: string; checkoutUrl?: string };
  const url = session.checkout_url ?? session.checkoutUrl;
  if (!url) throw new Error("Dodo checkout response missing checkout_url");
  return url;
}

export type DodoPaymentRecord = {
  payment_id?: string;
  status?: string | null;
  metadata?: Record<string, string>;
};

/** Fetch payment status from Dodo API (test or live base URL from env). */
export async function fetchDodoPayment(dodoPaymentId: string): Promise<DodoPaymentRecord | null> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${apiBase()}/payments/${encodeURIComponent(dodoPaymentId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("fetchDodoPayment failed", dodoPaymentId, res.status);
      return null;
    }
    return (await res.json()) as DodoPaymentRecord;
  } catch (e) {
    console.warn("fetchDodoPayment error", e);
    return null;
  }
}

export function dodoProductIdForTier(tier: "founder_pro" | "room_pro"): string | null {
  const founder = process.env.DODO_FOUNDER_PRO_PRODUCT_ID?.trim() || "pdt_0Nm2z9ZHI8uSMGj2KPzcA";
  const room = process.env.DODO_ROOM_PRO_PRODUCT_ID?.trim() || "pdt_0Nm2zSAGAeI2UbUtdTKxd";
  if (tier === "founder_pro") return founder;
  return room;
}

export async function createDodoSubscriptionCheckout(params: {
  paymentId: string;
  tier: "founder_pro" | "room_pro";
  amountDollars: number;
  email?: string;
  userId: string;
}): Promise<string> {
  const productId = dodoProductIdForTier(params.tier);
  if (!productId) {
    throw new Error(
      `Dodo product ID missing for ${params.tier}. Set DODO_FOUNDER_PRO_PRODUCT_ID or DODO_ROOM_PRO_PRODUCT_ID on Vercel.`
    );
  }
  return createDodoCheckout({
    paymentId: params.paymentId,
    amount: params.amountDollars,
    listingUrl: "https://kingbid.lol/pricing",
    displayUrl: "KingBid Pro",
    email: params.email,
    productId,
    returnUrl: `${siteUrl()}/pricing?subscribed=${params.tier}&sub=${encodeURIComponent(params.paymentId)}`,
    metadata: {
      type: "subscription",
      tier: params.tier,
      userId: params.userId,
      subscriptionPaymentId: params.paymentId,
      paymentId: params.paymentId,
    },
  });
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
