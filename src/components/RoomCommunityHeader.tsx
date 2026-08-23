"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { keeperLevelLabel } from "@/lib/keeper-privileges";

type RoomPayload = {
  room: {
    name: string;
    founderCount: number;
    productCount: number;
    totalBidCents: number;
    totalClicks: number;
    keeperCount: number;
  };
  headKeeper: {
    handle: string;
    profileUrl: string;
    level: string;
    isCurator: boolean;
  } | null;
  currentKing: {
    slug: string;
    displayUrl: string;
    title: string;
    currentBid: number;
    clickCount: number;
    reignLabel: string | null;
  } | null;
};

export function RoomCommunityHeader({ roomSlug }: { roomSlug: string }) {
  const { data } = useSWR<RoomPayload>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);
  const theme = getCategoryRoomTheme(roomSlug);

  if (!data) {
    return <div className="mt-6 h-36 animate-pulse rounded-[20px] bg-surface-2" />;
  }

  const { room, headKeeper, currentKing } = data;
  const roomTitle = theme?.name ?? room.name;
  const roomLabel = theme?.roomLabel ?? room.name;

  return (
    <div className="room-interior-reveal mt-6 overflow-hidden rounded-[20px] border border-border bg-surface shadow-[var(--shadow)]">
      <div className="border-b border-border bg-surface-2/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kb-eyebrow">{roomLabel}</p>
            <h2 className="font-display mt-1 text-[26px] font-semibold leading-tight sm:text-[30px]">{roomTitle}</h2>
            {headKeeper ? (
              <p className="mt-2 text-[14px] text-muted">
                Keeper:{" "}
                <Link href={headKeeper.profileUrl} className="font-semibold text-accent hover:underline">
                  @{headKeeper.handle}
                </Link>
                <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                  {keeperLevelLabel(headKeeper.level)}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-muted">
                No keeper yet —{" "}
                <Link href="/founders" className="font-medium text-accent hover:underline">
                  earn it on Founder Hub
                </Link>
              </p>
            )}
          </div>
          {theme && (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-peach text-2xl">
              {theme.icon}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <StatCell label="Founders" value={room.founderCount.toLocaleString()} />
        <StatCell label="Products" value={room.productCount.toLocaleString()} />
        <StatCell label="Total bids" value={formatMoney(room.totalBidCents)} />
        <StatCell label="Clicks" value={room.totalClicks.toLocaleString()} />
      </div>

      {currentKing ? (
        <div className="flex flex-col gap-3 border-t border-border bg-gradient-to-r from-peach/40 to-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Current King</p>
            <Link href={`/l/${currentKing.slug}`} className="font-display mt-1 block text-[20px] font-semibold hover:text-accent">
              {currentKing.displayUrl}
            </Link>
            <p className="text-[13px] text-muted">
              {currentKing.title}
              {currentKing.reignLabel ? ` · ${currentKing.reignLabel}` : ""}
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Bid</p>
              <p className="font-mono-label text-[20px] font-semibold text-accent">{formatMoney(currentKing.currentBid)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Clicks</p>
              <p className="font-mono-label text-[20px] font-semibold">{currentKing.clickCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-5 py-4 text-[13px] text-muted sm:px-6">
          👑 Throne open — founding #1 is the cheapest this room will ever be.
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-4 text-center sm:text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono-label mt-1 text-[18px] font-semibold text-foreground sm:text-[20px]">{value}</p>
    </div>
  );
}
