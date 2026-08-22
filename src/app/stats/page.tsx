"use client";

import useSWR from "swr";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import type { LeaderboardData } from "@/lib/leaderboard";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";

interface HourBucket {
  hour: string;
  bids: number;
  revenue: number;
}

interface Stats {
  online: number;
  totalVisitors: number;
  totalBids: number;
  totalRevenue: number;
  totalClicks: number;
  totalListings: number;
  launchedAt: string;
  hoursSinceLaunch: number;
  bidsLastHour: number;
  revenueLastHour: number;
  hourly: HourBucket[];
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`tabular mt-1.5 text-3xl font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: HourBucket[] }) {
  const max = Math.max(1, ...hourly.map((h) => h.revenue));
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Revenue, last 24 hours</h2>
        <p className="text-[12px] text-muted">each bar = 1 hour · real completed payments</p>
      </div>
      <div className="mt-4 flex h-28 items-end gap-1">
        {hourly.map((h) => (
          <div
            key={h.hour}
            title={`${new Date(h.hour).toLocaleTimeString([], { hour: "numeric" })} · ${formatMoney(h.revenue)} · ${h.bids} bids`}
            className="flex-1 rounded-t-sm bg-accent/80 hover:bg-accent transition-colors"
            style={{ height: `${Math.max(4, (h.revenue / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  useLiveUpdates();
  const { data: stats } = useSWR<Stats>("/api/stats", fetcher, { refreshInterval: 8_000 });
  const { data: board } = useSWR<LeaderboardData>("/api/listings?limit=10", fetcher, {
    refreshInterval: 8_000,
  });

  const perHour =
    stats && stats.hoursSinceLaunch > 0
      ? formatMoney(Math.round(stats.totalRevenue / Math.max(1, stats.hoursSinceLaunch)))
      : "—";

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-12`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live stats</h1>
            <p className="mt-2 text-muted">
              Every number on this page is counted from the database as it happens. Nothing is inflated.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" />
            live
          </span>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total revenue"
            value={stats ? formatMoney(stats.totalRevenue) : "—"}
            hint={stats ? `${perHour}/hour since launch` : undefined}
            accent
          />
          <StatCard
            label="Completed bids"
            value={stats ? stats.totalBids.toLocaleString() : "—"}
            hint={stats ? `${stats.bidsLastHour} in the last hour` : undefined}
          />
          <StatCard label="Listings on board" value={stats ? stats.totalListings.toLocaleString() : "—"} />
          <StatCard
            label="Online now"
            value={stats ? stats.online.toLocaleString() : "—"}
            hint="open tabs + recent visitors"
          />
          <StatCard
            label="Visitors since launch"
            value={stats ? stats.totalVisitors.toLocaleString() : "—"}
            hint="unique IPs, not pageviews"
          />
          <StatCard label="Outbound clicks" value={stats ? stats.totalClicks.toLocaleString() : "—"} />
        </div>

        {stats?.hourly && <div className="mt-4"><HourlyChart hourly={stats.hourly} /></div>}

        <h2 className="mt-12 text-[15px] font-semibold">Top spenders right now</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3 text-right">Total bid</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {(board?.entries ?? []).map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="tabular px-4 py-3 font-semibold text-accent">#{e.rank}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{e.displayUrl}</span>
                  </td>
                  <td className="tabular px-4 py-3 text-right font-bold text-accent">
                    {formatMoney(e.currentBid)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-muted hidden sm:table-cell">
                    {e.clickCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
