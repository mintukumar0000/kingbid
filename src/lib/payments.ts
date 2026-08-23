// Unified payment layer: mock (local) → Dodo (preferred) → Polar (legacy).

import { createDodoCheckout, isDodoConfigured } from "@/lib/dodo";
import { createPolarCheckout, isPolarConfigured } from "@/lib/polar";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export interface CheckoutParams {
  paymentId: string;
  amount: number;
  listingUrl: string;
  displayUrl: string;
  email?: string;
  productId?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export function isMockPayments(): boolean {
  return !isDodoConfigured() && !isPolarConfigured();
}

export function activePaymentProvider(): "mock" | "dodo" | "polar" {
  if (isDodoConfigured()) return "dodo";
  if (isPolarConfigured()) return "polar";
  return "mock";
}

export async function createCheckout(params: CheckoutParams): Promise<string> {
  if (isMockPayments()) {
    return `${siteUrl()}/checkout/mock?payment=${encodeURIComponent(params.paymentId)}`;
  }
  if (isDodoConfigured()) return createDodoCheckout(params);
  return createPolarCheckout(params);
}
