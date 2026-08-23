"use client";

import { useState } from "react";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";

export function PricingCheckoutButtons({ tier }: { tier: SubscriptionTier }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed.");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  const info = SUBSCRIPTION_TIERS[tier];

  return (
    <div className="mt-4 space-y-2">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent"
        required
      />
      {error && <p className="text-[12px] text-red">{error}</p>}
      <button
        type="button"
        onClick={checkout}
        disabled={loading || !email}
        className="w-full rounded-full bg-accent py-2.5 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Redirecting…" : `Subscribe · $${info.price}/mo via Dodo`}
      </button>
    </div>
  );
}
