"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { liveStat } from "@/lib/copy";

export interface PlatformStats {
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
}

export function StatsBar() {
  const { data } = useSWR<PlatformStats>("/api/stats", fetcher, { refreshInterval: 20_000 });

  return (
    <p className="inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border border-border bg-[#f5f0eb] px-4 py-1.5 text-[12px] sm:text-[12.5px]">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" aria-hidden />
        <span className="tabular font-medium text-green">{liveStat(data?.online)} online</span>
      </span>
      <span className="text-muted/50">·</span>
      <span className="tabular text-foreground/75">
        {liveStat(data?.totalVisitors)} visitors since launch
      </span>
      <span className="text-muted/50">·</span>
      <Link
        href="/stats"
        className="font-medium text-foreground/80 hover:text-foreground hover:underline"
      >
        see stats →
      </Link>
    </p>
  );
}
