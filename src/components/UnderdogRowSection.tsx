"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";

export function UnderdogRowSection({ categorySlug }: { categorySlug?: string }) {
  const url = categorySlug
    ? `/api/underdog?category=${encodeURIComponent(categorySlug)}`
    : "/api/underdog";
  const { data } = useSWR<{
    underdogs: {
      slug: string;
      displayUrl: string;
      currentBid: number;
      revenueBand: string;
      revenueVerified: boolean;
      sacrificeScore: number;
    }[];
  }>(url, fetcher);

  return (
    <div className="luxury-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-[16px] font-semibold">Underdogs</h3>
        <Link href="/underdogs" className="text-[11px] font-semibold text-accent hover:underline">
          Full row →
        </Link>
      </div>
      {!data?.underdogs.length ? (
        <p className="mt-2 text-[13px] text-muted">Conviction rank — pick a revenue band when you claim.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-[13px]">
          {data.underdogs.slice(0, 4).map((u, i) => (
            <li key={u.slug} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/l/${u.slug}`} className="truncate font-medium hover:text-accent">
                  #{i + 1} {u.displayUrl}
                </Link>
                <p className="text-[10px] text-muted">
                  {REVENUE_BAND_LABELS[u.revenueBand as RevenueBand] ?? u.revenueBand}
                  {u.revenueVerified ? " ✓ verified" : " (self-reported)"}
                </p>
              </div>
              <span className="font-mono-label shrink-0 text-[11px] text-accent">{u.sacrificeScore.toFixed(1)}×</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
