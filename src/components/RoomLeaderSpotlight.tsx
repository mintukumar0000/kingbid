"use client";

import Link from "next/link";
import { useState } from "react";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { formatMoney, faviconFor } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { RelativeTime } from "@/components/RelativeTime";

/** Current #1 spotlight inside a category room. */
export function RoomLeaderSpotlight({
  leader,
  categorySlug,
  totalListings,
}: {
  leader: LeaderboardEntry | null;
  categorySlug: string;
  totalListings: number;
}) {
  const theme = getCategoryRoomTheme(categorySlug);

  if (!leader) {
    return (
      <div className="rounded-[18px] border border-dashed border-[#f0cfc3] bg-peach/40 px-5 py-6 text-center">
        <p className="text-2xl" aria-hidden>
          👑
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Throne open
        </p>
        <p className="mt-1 text-[15px] font-semibold text-foreground">
          No #1 yet in {theme?.roomLabel ?? "this room"}
        </p>
        <p className="mt-1 text-[13px] text-muted">First paid listing takes the crown.</p>
      </div>
    );
  }

  const clicksPerDay =
    leader.clicksPerHour > 0 ? `~${Math.max(1, leader.clicksPerHour * 24)} clicks/day pace` : "First clicks incoming";

  return (
    <div className="overflow-hidden rounded-[18px] border-2 border-[#f0cfc3] bg-peach shadow-[0_8px_32px_rgba(229,91,60,0.1)]">
      <div className="border-b border-[#f0cfc3]/80 bg-surface/80 px-4 py-2.5 text-center sm:text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          👑 Reigning in {theme?.roomLabel ?? "this room"}
        </p>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconFor(leader.url)}
          alt=""
          width={56}
          height={56}
          className="mx-auto h-14 w-14 shrink-0 rounded-2xl bg-surface ring-2 ring-[#f0cfc3] sm:mx-0"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
              #{leader.rank}
            </span>
            <span className="rounded-full border border-[#f0cfc3] bg-surface px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {totalListings === 1 ? "Sole ruler" : `${totalListings} competing`}
            </span>
          </div>
          <p className="mt-2 truncate text-[18px] font-bold text-foreground">{leader.displayUrl}</p>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{leader.title}</p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-muted sm:justify-start">
            <span className="tabular font-semibold text-accent">{formatMoney(leader.currentBid)} bid</span>
            <span className="text-accent/60">·</span>
            <span className="tabular">{leader.clickCount.toLocaleString()} clicks</span>
            <span className="text-accent/60">·</span>
            <RelativeTime date={leader.lastBidAt} />
          </p>
          <p className="mt-1.5 text-[11px] text-muted">{clicksPerDay}</p>
        </div>
        <div className="shrink-0 text-center sm:text-right">
          <p className="tabular text-[28px] font-bold leading-none text-accent">
            {formatMoney(leader.currentBid)}
          </p>
          <p className="mt-1 text-[11px] text-muted">to dethrone</p>
          <Link
            href={`/l/${leader.slug}`}
            className="mt-2 inline-block text-[12px] font-semibold text-accent hover:underline"
          >
            View listing →
          </Link>
        </div>
      </div>
    </div>
  );
}
