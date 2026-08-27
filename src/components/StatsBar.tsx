"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { liveStat } from "@/lib/copy";
import { PAGE_WIDE } from "@/lib/layout";

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
  const { data } = useSWR<PlatformStats>("/api/stats", fetcher, { refreshInterval: 8_000 });

  return (
    <div className={`${PAGE_WIDE} flex justify-center py-3`}>
      <p className="site-stats-bar inline-flex flex-wrap items-center justify-center gap-x-2 px-4 py-1.5 text-[12px] sm:text-[12.5px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" aria-hidden />
          <span className="tabular font-semibold text-green">{liveStat(data?.online)} online</span>
        </span>
        <span className="text-muted/40">·</span>
        <span className="tabular text-foreground/80">
          {liveStat(data?.totalVisitors)} visitors since launch
        </span>
        <span className="hidden text-muted/40 sm:inline">·</span>
        <span className="hidden tabular text-foreground/70 sm:inline">
          {liveStat(data?.totalBids)} bids
        </span>
        <span className="text-muted/40">·</span>
        <Link href="/stats" className="font-medium text-foreground/85 hover:text-foreground hover:underline">
          see stats →
        </Link>
      </p>
    </div>
  );
}
