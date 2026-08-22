"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

interface CheckoutInfo {
  paymentId: string;
  amount: number;
  status: string;
  isTakeover: boolean;
  listingTitle: string;
  displayUrl: string;
}

function MockCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("payment");
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!paymentId) return;
    fetch(`/api/mock-pay?payment=${encodeURIComponent(paymentId)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setInfo(d)))
      .catch(() => setError("Could not load checkout."));
  }, [paymentId]);

  async function pay(outcome: "success" | "fail") {
    if (!paymentId) return;
    setPaying(true);
    const res = await fetch("/api/mock-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, outcome: outcome === "fail" ? "fail" : "success" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Payment failed.");
      setPaying(false);
      return;
    }
    if (outcome === "fail") {
      router.push("/?payment=failed");
    } else {
      router.push(`/success/${encodeURIComponent(paymentId)}`);
    }
  }

  if (!paymentId) return <p className="text-muted">Missing payment reference.</p>;
  if (error) {
    return (
      <div className="text-center">
        <p className="text-red mb-4">{error}</p>
        <Link href="/" className="text-accent underline">Back to the leaderboard</Link>
      </div>
    );
  }
  if (!info) return <p className="text-muted">Loading checkout…</p>;

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 rounded-lg border border-accent/40 bg-accent-soft px-4 py-2.5 text-center text-xs font-semibold text-accent">
        TEST MODE — this simulates Polar checkout. No real money moves. Add POLAR_ACCESS_TOKEN to
        use real payments.
      </div>

      <div className="rounded-2xl border border-border-strong bg-surface p-6 shadow-2xl">
        <h1 className="text-lg font-bold">Complete your payment</h1>
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{info.isTakeover ? "Takeover (3h #1 lock)" : "Bid"}</span>
            <span className="font-semibold">{info.listingTitle}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted">{info.displayUrl}</span>
            <span className="tabular text-xl font-extrabold">{formatMoney(info.amount)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <input
            disabled
            placeholder="4242 4242 4242 4242"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-muted"
          />
          <div className="flex gap-3">
            <input disabled placeholder="12 / 34" className="w-1/2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-muted" />
            <input disabled placeholder="CVC" className="w-1/2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-muted" />
          </div>
        </div>

        {info.status === "completed" ? (
          <p className="mt-5 text-center text-sm text-green">This payment is already completed.</p>
        ) : (
          <>
            <button
              onClick={() => pay("success")}
              disabled={paying}
              className="mt-5 w-full rounded-full bg-accent px-4 py-3 text-base font-bold text-white hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {paying ? "Processing…" : `Pay ${formatMoney(info.amount)}`}
            </button>
            <button
              onClick={() => pay("fail")}
              disabled={paying}
              className="mt-2.5 w-full rounded-xl border border-border px-4 py-2.5 text-sm text-muted hover:border-red hover:text-red disabled:opacity-60 transition-all"
            >
              Simulate failed payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <MockCheckout />
      </Suspense>
    </main>
  );
}
