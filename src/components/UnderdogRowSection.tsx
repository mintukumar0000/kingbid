"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";

export function UnderdogRowSection({ categorySlug }: { categorySlug?: string }) {
  const url = categorySlug
    ? `/api/underdog?category=${encodeURIComponent(categorySlug)}`
    : "/api/underdog";
  const { data } = useSWR<{ underdogs: { slug: string; displayUrl: string; currentBid: number; revenueBand: string; revenueVerified: boolean; sacrificeScore: number }[] }>(
    url,
    fetcher
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-[13px] font-semibold">🐕 Underdog Row (Sacrifice rank)</h3>
      <p className="mt-1 text-[12px] text-muted">
        Separate from money rank — bid ÷ revenue band, normalized in this room.
      </p>
      {!data?.underdogs.length ? (
        <p className="mt-3 text-[13px] text-muted">0 sacrifice scores — founders pick a revenue band on claim.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-[13px]">
          {data.underdogs.slice(0, 5).map((u, i) => (
            <li key={u.slug} className="flex justify-between gap-2">
              <span>
                #{i + 1}{" "}
                <Link href={`/l/${u.slug}`} className="font-medium hover:underline">
                  {u.displayUrl}
                </Link>
              </span>
              <span className="text-muted shrink-0">
                {formatMoney(u.currentBid)} · {REVENUE_BAND_LABELS[u.revenueBand as RevenueBand]}
                {!u.revenueVerified ? " (unverified)" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
