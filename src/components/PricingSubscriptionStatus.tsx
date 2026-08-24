"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";

export function PricingSubscriptionStatus({ tierHint }: { tierHint?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "active" | "pending" | "error">("checking");
  const [label, setLabel] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const subscribed = tierHint ?? searchParams.get("subscribed");
  const tier = (subscribed === "founder_pro" || subscribed === "room_pro" ? subscribed : null) as
    | SubscriptionTier
    | null;
  const hasReturnParams =
    !!tier ||
    searchParams.get("status") === "active" ||
    !!searchParams.get("sub") ||
    !!searchParams.get("payment_id");

  const sync = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/subscriptions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ourPaymentId: searchParams.get("sub") ?? undefined,
          dodoPaymentId: searchParams.get("payment_id") ?? undefined,
          tier: tier ?? undefined,
          redirectStatus: searchParams.get("status") ?? undefined,
          email: searchParams.get("email") ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.isPro && data.subscription) {
        setStatus("active");
        setLabel(data.subscription.label);
        router.refresh();
        return true;
      }
      if (data.sync === "not_found" && !tier) {
        setStatus("error");
        return false;
      }
      setStatus("pending");
      return false;
    } catch {
      setStatus("error");
      return false;
    } finally {
      setChecking(false);
    }
  }, [router, searchParams, tier]);

  useEffect(() => {
    if (!hasReturnParams) return;
    let attempts = 0;
    void sync();
    const tick = setInterval(async () => {
      attempts++;
      const done = await sync();
      if (done || attempts >= 30) clearInterval(tick);
    }, 2000);
    return () => clearInterval(tick);
  }, [sync, hasReturnParams]);

  if (!hasReturnParams) return null;

  const tierLabel = tier ? SUBSCRIPTION_TIERS[tier].label : label ?? "Pro";

  if (status === "active") {
    return (
      <div className="mt-6 rounded-xl border border-green/40 bg-green/10 px-4 py-4 text-center">
        <p className="text-[15px] font-semibold text-green">✓ {label ?? tierLabel} is active</p>
        <p className="mt-1 text-[13px] text-muted">
          You&apos;re verified — check{" "}
          <Link href="/founders" className="font-medium text-accent hover:underline">
            Founder Hub
          </Link>{" "}
          (Tier shows your plan) or{" "}
          <Link href="/api/me" className="font-medium text-accent hover:underline">
            /api/me
          </Link>{" "}
          for <code className="text-[12px]">subscription</code>.
        </p>
      </div>
    );
  }

  if (status === "pending" || status === "checking") {
    return (
      <div className="mt-6 rounded-xl border border-green/30 bg-green/5 px-4 py-4 text-center">
        <p className="text-[13px] text-green">
          Payment received — activating {tierLabel}
          {status === "checking" ? "…" : "…"} usually a few seconds.
        </p>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={checking}
          className="mt-3 rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent disabled:opacity-50"
        >
          {checking ? "Checking…" : "Activate Pro now"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface-2 px-4 py-3 text-center text-[13px] text-muted">
      Could not verify subscription — click Activate or contact support with your payment email.
      <button
        type="button"
        onClick={() => void sync()}
        disabled={checking}
        className="mt-2 block w-full rounded-full border border-border py-2 text-[12px] font-semibold hover:border-accent disabled:opacity-50"
      >
        Try again
      </button>
    </div>
  );
}

/** Small badge for nav / hub — polls /api/me subscription. */
export function ProStatusBadge() {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTier(d.subscription?.tier ?? null))
      .catch(() => {});
  }, []);

  if (!tier || tier === "free") return null;

  const label =
    tier === "founder_pro"
      ? "Founder Pro"
      : tier === "room_pro"
        ? "Room Pro"
        : tier.replace(/_/g, " ");

  return (
    <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">
      ✓ {label}
    </span>
  );
}
