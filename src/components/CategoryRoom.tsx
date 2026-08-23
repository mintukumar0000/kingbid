"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { formatMoney } from "@/lib/format";

type Props = {
  slug: string;
  boardId: string | null;
  listingCount: number;
  topBid: number;
  foundingPrice: number;
  onExit: () => void;
  children: ReactNode;
};

/** Inside a category square — light premium interior matching kingbid.lol. */
export function CategoryRoom({
  slug,
  boardId,
  listingCount,
  topBid,
  foundingPrice,
  onExit,
  children,
}: Props) {
  const theme = getCategoryRoomTheme(slug);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [slug]);

  if (!theme) return <>{children}</>;

  const historyHref = boardId ? `/history/${boardId}` : "/history/global";

  return (
    <section className={`room-interior px-4 pb-8 sm:px-6 ${entered ? "room-interior-entered" : ""}`}>
      <div className="mx-auto max-w-2xl">
        {/* Back + breadcrumb */}
        <div className="room-interior-reveal flex flex-wrap items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[12px] font-medium text-muted shadow-sm transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All rooms
          </button>
          <p className="text-[11px] text-muted">
            Global · <span className="font-medium text-foreground">{theme.roomLabel}</span>
          </p>
        </div>

        {/* Square portal header */}
        <div className="room-interior-reveal mt-6 flex justify-center" style={{ animationDelay: "60ms" }}>
          <div className="room-portal relative flex aspect-square w-[min(100%,220px)] flex-col items-center justify-center rounded-[22px] border-2 border-[#f0cfc3] bg-peach p-6 shadow-[var(--shadow)]">
            <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-accent/50" />
            <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-accent/50" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-accent/50" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-accent/50" />

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0cfc3] bg-surface text-2xl text-accent shadow-sm">
              {theme.icon}
            </span>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              You entered
            </p>
            <h2 className="mt-1 text-center text-[17px] font-bold leading-tight text-foreground">
              {theme.roomLabel}
            </h2>
          </div>
        </div>

        {/* Room title + invite strip */}
        <header className="room-interior-reveal mt-6 text-center" style={{ animationDelay: "120ms" }}>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
            {theme.name}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">{theme.motto}</p>
        </header>

        <div
          className="room-interior-reveal mt-5 rounded-[16px] border border-[#f0cfc3] bg-accent-soft px-4 py-3 text-center"
          style={{ animationDelay: "160ms" }}
        >
          <p className="text-[12px] font-semibold text-accent">🔑 Invite-only listing</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Founders enter with a personal claim link, then pay to rank. No one is added without
            consent.
          </p>
        </div>

        {/* Stats */}
        <div
          className="room-interior-reveal mt-5 grid grid-cols-3 gap-2 sm:gap-3"
          style={{ animationDelay: "200ms" }}
        >
          <StatCard label="Inside" value={listingCount.toLocaleString()} />
          <StatCard
            label="#1 bid"
            value={topBid > 0 ? formatMoney(topBid) : formatMoney(foundingPrice)}
            accent
          />
          <StatCard label="Founding" value={formatMoney(foundingPrice)} />
        </div>

        <div
          className="room-interior-reveal mt-4 flex flex-wrap items-center justify-center gap-3 text-[12px]"
          style={{ animationDelay: "240ms" }}
        >
          <Link href={historyHref} className="font-medium text-accent hover:underline">
            Reign history →
          </Link>
          <span className="text-border">·</span>
          <span className="text-muted">Real bids · Real clicks</span>
        </div>

        {/* Main content frame — square-edged premium card */}
        <div
          className="room-interior-reveal room-content-frame mt-8 rounded-[20px] border border-[#f0cfc3] bg-surface p-5 shadow-[var(--shadow)] sm:p-7"
          style={{ animationDelay: "280ms" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border px-2 py-3 text-center sm:px-3 ${
        accent ? "border-[#f0cfc3] bg-peach" : "border-border bg-surface-2"
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[10px]">
        {label}
      </p>
      <p className={`tabular mt-1 text-[15px] font-bold sm:text-[17px] ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
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
  const theme = getCategoryRoomTheme(slug);

  return (
    <div className="rounded-[16px] border border-dashed border-[#f0cfc3] bg-peach/50 px-6 py-12 text-center">
      <p className="text-3xl" aria-hidden>
        👑
      </p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        Throne available
      </p>
      <p className="mt-2 text-[16px] font-semibold text-foreground">
        0 listings in {theme?.roomLabel ?? "this room"}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
        Founding #1 starts at {formatMoney(minBid)} — the lowest this room will ever be.
      </p>
      <button
        type="button"
        onClick={onClaim}
        className="mt-6 rounded-full bg-accent px-7 py-2.5 text-[14px] font-semibold text-white hover:brightness-110 active:scale-[0.98]"
      >
        Claim founding spot
      </button>
      <p className="mt-3 text-[11px] text-muted">Have an invite? Use your claim link to list here.</p>
    </div>
  );
}
