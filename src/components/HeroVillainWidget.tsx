"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";

export function HeroVillainWidget({ categorySlug }: { categorySlug?: string }) {
  const url = categorySlug
    ? `/api/home-sections?category=${encodeURIComponent(categorySlug)}`
    : "/api/home-sections";
  const { data } = useSWR<{
    globalKing: { displayUrl: string; slug: string; currentBid: number; gapLabel: string | null } | null;
    challenger: { displayUrl: string; slug: string; currentBid: number } | null;
  }>(url, fetcher, { refreshInterval: 15_000 });

  if (!data?.globalKing) return null;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">👑 King</p>
        <Link href={`/l/${data.globalKing.slug}`} className="mt-1 block font-semibold hover:underline">
          {data.globalKing.displayUrl}
        </Link>
        <p className="text-[13px] text-muted">{formatMoney(data.globalKing.currentBid)}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">⚔️ Challenger</p>
        {data.challenger ? (
          <>
            <Link href={`/l/${data.challenger.slug}`} className="mt-1 block font-semibold hover:underline">
              {data.challenger.displayUrl}
            </Link>
            <p className="text-[13px] text-muted">
              {formatMoney(data.challenger.currentBid)}
              {data.globalKing.gapLabel ? ` · ${data.globalKing.gapLabel}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-muted">No challenger yet.</p>
        )}
      </div>
    </div>
  );
}
