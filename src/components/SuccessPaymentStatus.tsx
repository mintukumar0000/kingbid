"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  paymentId: string;
  dodoPaymentId?: string | null;
};

/** Poll + Dodo API sync until webhook or direct verify settles the bid. */
export function SuccessPaymentStatus({ paymentId, dodoPaymentId }: Props) {
  const router = useRouter();
  const [dots, setDots] = useState("");
  const [stuck, setStuck] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dodoPaymentId: dodoPaymentId ?? undefined }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string };
      if (data.status === "completed" || data.status === "failed") {
        router.refresh();
      }
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  }, [paymentId, dodoPaymentId, router]);

  useEffect(() => {
    let attempts = 0;
    void check();
    const tick = setInterval(async () => {
      attempts++;
      setDots(".".repeat((attempts % 3) + 1));
      await check();
      if (attempts >= 45) {
        clearInterval(tick);
        setStuck(true);
      }
    }, 2000);
    return () => clearInterval(tick);
  }, [check]);

  return (
    <div className="mt-3 space-y-3 text-muted">
      <p>
        Payment is processing{dots} Checking with Dodo directly — usually a few seconds.
      </p>
      {stuck && (
        <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-left text-[13px]">
          <p className="font-medium text-foreground">Still waiting?</p>
          <p className="mt-1">
            Test mode needs the webhook at{" "}
            <code className="text-accent">https://kingbid.lol/api/webhooks/dodo</code> in your Dodo
            dashboard (Test Mode → Developer → Webhooks, event: payment.succeeded).
          </p>
          <button
            type="button"
            onClick={() => void check()}
            disabled={checking}
            className="mt-3 rounded-full border border-border px-4 py-2 text-[13px] font-semibold hover:border-accent disabled:opacity-50"
          >
            {checking ? "Checking…" : "Check payment again"}
          </button>
        </div>
      )}
    </div>
  );
}
