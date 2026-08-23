"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { keeperLevelLabel } from "@/lib/keeper-privileges";
import { formatMoney } from "@/lib/format";

type RoomPayload = {
  room: {
    name: string;
    slug: string;
    memberCount: number;
    productCount: number;
    totalBidCents: number;
    totalClicks: number;
    breadcrumbs: { slug: string; name: string; href: string }[];
    childRooms: { slug: string; name: string; roomType: string }[];
  };
  headKeeper: {
    handle: string;
    profileUrl: string;
    level: string;
  } | null;
  currentKing: {
    slug: string;
    displayUrl: string;
    currentBid: number;
    clickCount: number;
  } | null;
  isFollowing: boolean;
};

export function RoomCommunityHeader({ roomSlug, pathPrefix }: { roomSlug: string; pathPrefix?: string }) {
  const { data, mutate } = useSWR<RoomPayload>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);
  const theme = getCategoryRoomTheme(roomSlug);

  if (!data) {
    return <div className="luxury-card h-32 animate-pulse" />;
  }

  const { room, headKeeper, currentKing, isFollowing } = data;
  const roomTitle = theme?.name ?? room.name;
  const basePath = pathPrefix ?? roomSlug;

  async function toggleFollow() {
    await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
      credentials: "include",
    });
    mutate();
  }

  return (
    <div className="luxury-card overflow-hidden">
      {room.breadcrumbs?.length > 0 && (
        <div className="border-b border-border px-5 py-2 text-[12px] text-muted sm:px-6">
          <Link href="/rooms" className="hover:text-accent">
            Rooms
          </Link>
          {room.breadcrumbs.map((b) => (
            <span key={b.slug}>
              {" "}
              /{" "}
              <Link href={b.href} className="hover:text-accent">
                {b.name}
              </Link>
            </span>
          ))}
          <span className="text-foreground"> / {room.name}</span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <p className="kb-eyebrow">{theme?.roomLabel ?? room.name}</p>
          <h2 className="font-display mt-1 text-[24px] font-semibold leading-tight sm:text-[28px]">{roomTitle}</h2>
          {headKeeper ? (
            <p className="mt-2 text-[13px] text-muted">
              Keeper{" "}
              <Link href={headKeeper.profileUrl} className="font-semibold text-accent hover:underline">
                @{headKeeper.handle}
              </Link>
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                {keeperLevelLabel(headKeeper.level)}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              <Link href="/founders" className="font-medium text-accent hover:underline">
                Earn keeper status →
              </Link>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleFollow}
            className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors ${
              isFollowing
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface hover:border-accent"
            }`}
          >
            {isFollowing ? "Following" : "Follow room"}
          </button>
          {theme && (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-peach text-xl">
              {theme.icon}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        <StatCell label="Members" value={room.memberCount.toLocaleString()} />
        <StatCell label="Products" value={room.productCount.toLocaleString()} />
        <StatCell label="Bids" value={formatMoney(room.totalBidCents)} />
        <StatCell label="Clicks" value={room.totalClicks.toLocaleString()} />
      </div>

      {room.childRooms?.length > 0 && (
        <div className="border-t border-border px-5 py-3 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Sub-rooms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {room.childRooms.map((c) => (
              <Link
                key={c.slug}
                href={`/rooms/${basePath}/${c.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium hover:border-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {currentKing ? (
        <div className="flex flex-col gap-3 border-t border-border bg-gradient-to-r from-peach/30 to-transparent px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Current King</p>
            <Link href={`/l/${currentKing.slug}`} className="font-display mt-0.5 block truncate text-[18px] font-semibold hover:text-accent">
              {currentKing.displayUrl}
            </Link>
          </div>
          <div className="flex shrink-0 gap-5 text-right">
            <div>
              <p className="text-[10px] uppercase text-muted">Bid</p>
              <p className="font-mono-label text-[17px] font-semibold text-accent">{formatMoney(currentKing.currentBid)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted">Clicks</p>
              <p className="font-mono-label text-[17px] font-semibold">{currentKing.clickCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-5 py-3 text-[13px] text-muted sm:px-6">
          👑 Throne open — founding #1 is the cheapest this room will ever be.
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3 text-center sm:text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono-label mt-0.5 text-[16px] font-semibold">{value}</p>
    </div>
  );
}
