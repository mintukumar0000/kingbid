"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Poll until webhook settles the bid (pending → completed). */
export function SuccessPaymentStatus({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [dots, setDots] = useState("");

  useEffect(() => {
    let attempts = 0;
    const tick = setInterval(async () => {
      attempts++;
      setDots(".".repeat((attempts % 3) + 1));
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (data.status === "completed" || data.status === "failed") {
          router.refresh();
        }
      } catch {
        /* ignore */
      }
      if (attempts >= 20) clearInterval(tick);
    }, 2000);
    return () => clearInterval(tick);
  }, [paymentId, router]);

  return (
    <p className="mt-3 text-muted">
      Payment is processing{dots} Rank updates when Dodo confirms payment — usually a few seconds.
    </p>
  );
}
