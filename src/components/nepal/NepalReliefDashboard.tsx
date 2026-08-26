"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { RelativeTime } from "@/components/RelativeTime";

type DashboardPayload = {
  enabled: boolean;
  totals?: {
    raised: number;
    awaitingSettlement: number;
    receivedByKingbid: number;
    donated: number;
    paymentCount: number;
  };
  updatedAt?: string;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface/60 px-3 py-2.5">
      <p className="font-mono-label text-[18px] font-semibold text-foreground sm:text-[20px]">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

export function NepalReliefDashboard({ compact = false }: { compact?: boolean }) {
  const { data } = useSWR<DashboardPayload>("/api/nepal-relief", fetcher, { refreshInterval: 15_000 });

  if (!data?.enabled || !data.totals) {
    return compact ? null : (
      <div className="nepal-dashboard-card animate-pulse rounded-[18px] p-8">
        <div className="h-8 w-48 rounded bg-surface-2" />
      </div>
    );
  }

  const t = data.totals;

  return (
    <section className={`nepal-dashboard-card rounded-[18px] ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kb-eyebrow !text-accent">🇳🇵 Nepal Flood Relief</p>
          <p className="font-mono-label mt-2 text-[36px] font-semibold leading-none text-accent sm:text-[44px]">
            {formatMoney(t.raised)}
          </p>
          <p className="mt-1 text-[13px] text-muted">raised through Kingbid — no cap, all tracked publicly</p>
        </div>
        <Link href="/nepal-relief" className="text-[13px] font-semibold text-accent hover:underline">
          Full transparency →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Successful campaign payments" value={formatMoney(t.raised)} />
        <Metric label="Awaiting settlement" value={formatMoney(t.awaitingSettlement)} />
        <Metric label="Received by Kingbid" value={formatMoney(t.receivedByKingbid)} />
        <Metric label="Donated" value={formatMoney(t.donated)} />
      </div>

      <p className="mt-4 text-[11px] text-muted">
        {t.paymentCount} successful payment{t.paymentCount === 1 ? "" : "s"}
        {data.updatedAt && (
          <>
            {" "}
            · Last updated <RelativeTime date={data.updatedAt} />
          </>
        )}
      </p>
    </section>
  );
}
