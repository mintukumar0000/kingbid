"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatLaunchAge } from "@/lib/format";
import { REVENUE_TICKER_LINE, liveStat } from "@/lib/copy";
import type { PlatformStats } from "@/components/StatsBar";

/** Revenue counter — real completed payments only. */
export function LiveRevenueTicker() {
  const { data } = useSWR<PlatformStats>("/api/stats", fetcher, { refreshInterval: 8_000 });
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (data) prev.current = data.totalRevenue;
  }, [data?.totalRevenue]);

  const amount = data?.totalRevenue ?? 0;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-20 pt-10 text-center sm:px-6">
      <p className="text-[15px] text-muted">{REVENUE_TICKER_LINE}</p>
      <p
        key={data?.totalRevenue ?? 0}
        className="ticker-up mx-auto mt-5 inline-flex items-baseline justify-center rounded-2xl border border-border bg-surface px-10 py-5 shadow-[var(--shadow)] sm:min-w-[340px] sm:px-14 sm:py-6"
      >
        <span className="text-4xl font-bold tabular text-accent sm:text-5xl">$</span>
        <span className="text-4xl font-bold tabular tracking-tight text-foreground sm:text-5xl">
          {liveStat(amount)}
        </span>
      </p>
      <p className="mt-4 text-[13px] text-muted">
        {data?.launchedAt ? `${formatLaunchAge(data.launchedAt)} since launch` : "since launch"}
      </p>
    </section>
  );
}
