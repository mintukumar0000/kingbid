"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { PAGE_WIDE } from "@/lib/layout";
import { formatMoney } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { RoomCommunityHeader } from "@/components/RoomCommunityHeader";
import { RoomEventFeed } from "@/components/RoomEventFeed";
import { RoomKeeperPanel } from "@/components/RoomKeeperPanel";
import { UnderdogRowSection } from "@/components/UnderdogRowSection";
import { RoomPinnedProducts, RoomKeeperTools } from "@/components/RoomKeeperTools";

type Props = {
  slug: string;
  boardId: string | null;
  listingCount: number;
  topBid: number;
  foundingPrice: number;
  onExit: () => void;
  topLeader: LeaderboardEntry | null;
  children: ReactNode;
};

/** Category room interior — compact, wide layout. */
export function CategoryRoom({
  slug,
  boardId,
  listingCount,
  foundingPrice,
  onExit,
  children,
}: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const historyHref = boardId ? `/history/${boardId}` : "/history/global";

  return (
    <section className={`room-interior relative overflow-hidden pb-10 ${entered ? "room-interior-entered" : ""}`}>
      <div className={`relative ${PAGE_WIDE}`}>
        <div className="room-interior-reveal flex flex-wrap items-center justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-muted shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All rooms
          </button>
          <Link
            href={historyHref}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Reign history →
          </Link>
        </div>

        <div className="room-interior-reveal mt-6" style={{ animationDelay: "60ms" }}>
          <RoomCommunityHeader roomSlug={slug} />
        </div>

        <div
          className="room-interior-reveal mt-5 grid gap-4 lg:grid-cols-3"
          style={{ animationDelay: "100ms" }}
        >
          <RoomEventFeed roomIdOrSlug={slug} />
          <RoomKeeperPanel roomSlug={slug} />
          <UnderdogRowSection categorySlug={slug} />
        </div>

        <RoomPinnedProducts roomSlug={slug} />
        <RoomKeeperTools roomSlug={slug} />

        <div className="room-interior-reveal mt-4 flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted" style={{ animationDelay: "120ms" }}>
          <Link href="/founders" className="font-medium text-accent hover:underline">
            Founder Hub
          </Link>
          <span>·</span>
          <span>Real bids · Real clicks</span>
        </div>

        <div
          className="room-interior-reveal luxury-card mt-8 p-6 sm:p-8"
          style={{ animationDelay: "160ms" }}
        >
          <div className="mb-6 border-b border-border/80 pb-5 text-center sm:text-left">
            <p className="kb-eyebrow">Leaderboard</p>
            <p className="font-display mt-1 text-[22px] font-semibold">Rank · Product · Bid · Clicks</p>
            <p className="mt-1 text-[13px] text-muted">
              Founding spot {formatMoney(foundingPrice)} · {listingCount} live · pay to move up
            </p>
            <p className="mt-2 text-[12px] text-muted">
              Only products claimed <strong className="font-medium text-foreground">in this room</strong> appear here.
              Claimed on the homepage first? Paste the same URL above — a $1 rebid joins this room&apos;s board.
            </p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

export function CategoryEmptyState({
  slug,
  minBid,
  onClaim,
}: {
  slug: string;
  minBid: number;
  onClaim: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border-2 border-dashed border-[#f0cfc3] bg-peach/40 px-6 py-14 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(229,91,60,0.12), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-4xl" aria-hidden>
          👑
        </p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Throne available
        </p>
        <p className="mt-2 text-[18px] font-bold text-foreground">0 listings in this room</p>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
          Founding #1 starts at {formatMoney(minBid)} — the lowest this room will ever be.
        </p>
        <button
          type="button"
          onClick={onClaim}
          className="mt-7 rounded-full bg-accent px-8 py-3 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(229,91,60,0.25)] hover:brightness-110 active:scale-[0.98]"
        >
          Claim founding spot
        </button>
      </div>
    </div>
  );
}
