"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { formatMoney } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { RoomLeaderSpotlight } from "@/components/RoomLeaderSpotlight";
import { RoomEventFeed } from "@/components/RoomEventFeed";
import { HeroVillainWidget } from "@/components/HeroVillainWidget";

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

/** Inside a category square — premium interior matching kingbid.lol. */
export function CategoryRoom({
  slug,
  boardId,
  listingCount,
  topBid,
  foundingPrice,
  onExit,
  topLeader,
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
  const throneBid = topBid > 0 ? formatMoney(topBid) : formatMoney(foundingPrice);
  const unclaimed = topBid <= 0;

  return (
    <section
      className={`room-interior relative overflow-hidden pb-10 ${entered ? "room-interior-entered" : ""}`}
    >
      {/* Soft hero wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "linear-gradient(180deg, #fff5f2 0%, rgba(255,245,242,0.6) 45%, transparent 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* Nav */}
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
          <p className="text-[12px] text-muted">
            KingBid · <span className="font-medium text-foreground">{theme.roomLabel}</span>
          </p>
        </div>

        {/* Hero band */}
        <div
          className="room-interior-reveal mt-8 rounded-[24px] border border-[#f0cfc3] bg-surface p-6 shadow-[var(--shadow)] sm:p-8"
          style={{ animationDelay: "40ms" }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Portal square — larger */}
            <div className="room-portal relative flex aspect-square w-[200px] shrink-0 flex-col items-center justify-center rounded-[22px] border-2 border-[#f0cfc3] bg-peach p-5 shadow-[0_8px_32px_rgba(229,91,60,0.08)] sm:w-[220px]">
              <span className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 border-l-2 border-t-2 border-accent/55" />
              <span className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 border-r-2 border-t-2 border-accent/55" />
              <span className="pointer-events-none absolute bottom-3.5 left-3.5 h-5 w-5 border-b-2 border-l-2 border-accent/55" />
              <span className="pointer-events-none absolute bottom-3.5 right-3.5 h-5 w-5 border-b-2 border-r-2 border-accent/55" />

              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f0cfc3] bg-surface text-3xl text-accent shadow-sm">
                {theme.icon}
              </span>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
                Room open
              </p>
              <p className="mt-1 text-center text-[15px] font-bold leading-tight text-foreground">
                {theme.roomLabel}
              </p>
            </div>

            {/* Title block */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Category room
              </p>
              <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
                {theme.name}
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{theme.motto}</p>

              {unclaimed && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#f0cfc3] bg-peach px-3 py-1 text-[12px] font-semibold text-accent">
                  <span aria-hidden>👑</span> Founding throne unclaimed
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invite steps */}
        <div
          className="room-interior-reveal mt-5 overflow-hidden rounded-[20px] border border-[#f0cfc3] bg-accent-soft"
          style={{ animationDelay: "100ms" }}
        >
          <div className="border-b border-[#f0cfc3]/80 bg-peach/60 px-5 py-3 text-center sm:text-left">
            <p className="text-[13px] font-semibold text-accent">🔑 Invite-only · how founders enter</p>
          </div>
          <div className="grid gap-0 divide-y divide-[#f0cfc3]/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <InviteStep n={1} title="You send invite" text="Personal claim link for this room only." />
            <InviteStep n={2} title="They submit & pay" text="Founder lists their own URL — never pre-added." />
            <InviteStep n={3} title="Live on board" text="Rank set only by real bids in this room." />
          </div>
        </div>

        {/* Stats — larger premium cards */}
        <div
          className="room-interior-reveal mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
          style={{ animationDelay: "160ms" }}
        >
          <StatCard label="Listings inside" value={listingCount.toLocaleString()} sub="real, consented" />
          <StatCard
            label={unclaimed ? "Throne bid" : "Current #1"}
            value={throneBid}
            sub={unclaimed ? "founding price" : "top spot today"}
            accent
            featured
          />
          <StatCard label="Founding spot" value={formatMoney(foundingPrice)} sub="lowest ever here" />
        </div>

        <div
          className="room-interior-reveal mt-6"
          style={{ animationDelay: "180ms" }}
        >
          <HeroVillainWidget categorySlug={slug} />
        </div>

        <div
          className="room-interior-reveal mt-6"
          style={{ animationDelay: "200ms" }}
        >
          <RoomLeaderSpotlight
            leader={topLeader}
            categorySlug={slug}
            totalListings={listingCount}
          />
        </div>

        <div className="room-interior-reveal mt-5" style={{ animationDelay: "210ms" }}>
          <RoomEventFeed roomIdOrSlug={slug} />
        </div>

        <div
          className="room-interior-reveal mt-5 flex flex-wrap items-center justify-center gap-4 text-[13px]"
          style={{ animationDelay: "220ms" }}
        >
          <Link
            href={historyHref}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-1.5 font-medium text-accent shadow-sm hover:border-accent"
          >
            Reign history →
          </Link>
          <span className="text-muted">Real bids · Real clicks · No pre-listing</span>
        </div>

        {/* Bid + leaderboard frame */}
        <div
          className="room-interior-reveal room-content-frame mt-8 rounded-[24px] border-2 border-[#f0cfc3] bg-surface p-6 shadow-[0_12px_48px_rgba(229,91,60,0.08)] sm:p-8"
          style={{ animationDelay: "260ms" }}
        >
          <div className="mb-6 border-b border-border pb-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Bid in this room
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Have a claim invite? Open your link first, then bid below.
            </p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function InviteStep({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="px-5 py-4 text-center sm:text-left">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white">
        {n}
      </span>
      <p className="mt-2 text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  featured,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border px-5 py-5 text-center sm:text-left ${
        featured
          ? "border-accent/30 bg-peach shadow-[0_8px_28px_rgba(229,91,60,0.1)]"
          : accent
            ? "border-[#f0cfc3] bg-peach"
            : "border-border bg-surface-2"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={`tabular mt-2 text-[28px] font-bold leading-none sm:text-[32px] ${
          accent || featured ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] text-muted">{sub}</p>
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
        <p className="mt-2 text-[18px] font-bold text-foreground">
          0 listings in {theme?.roomLabel ?? "this room"}
        </p>
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
        <p className="mt-4 text-[12px] text-muted">
          Or use your personal <strong className="font-medium text-foreground">/claim/…</strong> invite link.
        </p>
      </div>
    </div>
  );
}
