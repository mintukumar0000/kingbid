"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { getCategoryRoomTheme, getPreset } from "@/lib/category-rooms";
import { formatMoney } from "@/lib/format";

type Props = {
  slug: string;
  boardId: string | null;
  listingCount: number;
  topBid: number;
  foundingPrice: number;
  children: ReactNode;
};

export function CategoryRoom({
  slug,
  boardId,
  listingCount,
  topBid,
  foundingPrice,
  children,
}: Props) {
  const theme = getCategoryRoomTheme(slug);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [slug]);

  if (!theme) return <>{children}</>;

  const preset = getPreset(theme);
  const vars = {
    "--room-bg": preset.bg,
    "--room-glow": preset.glow,
    "--room-accent": preset.accent,
    "--room-accent-soft": preset.accentSoft,
    "--room-text": preset.text,
    "--room-muted": preset.muted,
    "--room-border": preset.border,
    "--room-shimmer": preset.shimmer,
  } as CSSProperties;

  const historyHref = boardId ? `/history/${boardId}` : "/history/global";

  return (
    <div
      key={slug}
      className={`category-room relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8 ${entered ? "category-room-entered" : "category-room-entering"}`}
      style={vars}
    >
      {/* Ambient layers */}
      <div className="category-room-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="category-room-grain pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="category-room-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-4 pt-8 pb-2 sm:px-6 lg:px-8">
        {/* Entrance badge */}
        <div className="category-room-reveal flex justify-center" style={{ animationDelay: "0ms" }}>
          <span className="category-room-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]">
            <span className="category-room-pulse h-1.5 w-1.5 rounded-full" />
            Now entering
          </span>
        </div>

        {/* Room header */}
        <header className="category-room-reveal mt-6 text-center" style={{ animationDelay: "80ms" }}>
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--room-muted)]">
            <span className="h-px w-8 bg-[var(--room-border)]" />
            {theme.icon} {theme.roomLabel} {theme.icon}
            <span className="h-px w-8 bg-[var(--room-border)]" />
          </p>
          <h2 className="category-room-title mt-4 text-[26px] font-bold tracking-tight text-[var(--room-text)] sm:text-[34px]">
            {theme.name}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[var(--room-muted)]">
            {theme.motto}
          </p>
          {theme.isMeta && (
            <p className="mx-auto mt-2 max-w-sm text-[12px] italic text-[var(--room-accent)]">
              Members-only energy — every listing opted in with real payment.
            </p>
          )}
        </header>

        {/* Live room stats */}
        <div
          className="category-room-reveal mt-8 grid grid-cols-3 gap-2 sm:gap-3"
          style={{ animationDelay: "160ms" }}
        >
          <RoomStat label="In this room" value={listingCount.toLocaleString()} sub="listings" />
          <RoomStat
            label="Throne bid"
            value={topBid > 0 ? formatMoney(topBid) : formatMoney(foundingPrice)}
            sub={topBid > 0 ? "current #1" : "unclaimed"}
            highlight
          />
          <RoomStat label="Founding spot" value={formatMoney(foundingPrice)} sub="lowest ever" />
        </div>

        <div className="category-room-reveal mt-5 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: "220ms" }}>
          <Link
            href={historyHref}
            className="category-room-link text-[12px] font-medium tracking-wide transition-opacity hover:opacity-80"
          >
            View reign history →
          </Link>
          <span className="text-[var(--room-border)]">·</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--room-muted)]">
            Verified · Consent-only
          </span>
        </div>

        {/* Velvet frame */}
        <div className="category-room-reveal category-room-frame mt-8 rounded-[28px] p-[1px] sm:mt-10" style={{ animationDelay: "280ms" }}>
          <div className="category-room-inner rounded-[27px] px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomStat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`category-room-stat rounded-2xl border px-3 py-4 text-center sm:px-4 ${
        highlight ? "category-room-stat-highlight" : ""
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--room-muted)] sm:text-[10px]">
        {label}
      </p>
      <p className="category-room-stat-value tabular mt-1.5 text-[18px] font-bold text-[var(--room-text)] sm:text-[22px]">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-[var(--room-muted)] sm:text-[11px]">{sub}</p>
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
  const roomName = theme?.roomLabel ?? "this room";

  return (
    <div className="category-room-empty relative overflow-hidden rounded-2xl border px-6 py-14 text-center">
      <div className="category-room-empty-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative">
        <p className="text-4xl opacity-90" aria-hidden>
          👑
        </p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--room-accent)]">
          The throne is empty
        </p>
        <p className="mt-3 text-[17px] font-semibold text-[var(--room-text)]">
          0 listings in {roomName}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[var(--room-muted)]">
          Be the founding #1 for {formatMoney(minBid)} — the cheapest this room will ever be.
        </p>
        <button
          type="button"
          onClick={onClaim}
          className="category-room-cta mt-8 rounded-full px-8 py-3 text-[14px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Claim the founding crown
        </button>
        <p className="mt-4 text-[11px] text-[var(--room-muted)]">
          Every listing here opted in with a real payment.
        </p>
      </div>
    </div>
  );
}
