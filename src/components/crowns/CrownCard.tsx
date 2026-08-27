"use client";

import Link from "next/link";
import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import { crownVisual } from "@/lib/crown-visuals";
import { RelativeTime } from "@/components/RelativeTime";

function KingAvatar({ crown, size = 48 }: { crown: CrownState; size?: number }) {
  const visual = crownVisual(crown.slug);
  if (crown.hasKing && crown.kingUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconFor(crown.kingUrl)}
        alt=""
        width={size}
        height={size}
        className="rounded-xl bg-surface object-cover ring-2 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-surface-2 text-xl ring-2 ring-white/10"
      style={{ width: size, height: size, color: visual.accent }}
    >
      {visual.icon}
    </div>
  );
}

function StatusPills({ crown }: { crown: CrownState }) {
  return (
    <>
      {crown.isNewKing && (
        <span className="crown-pill crown-pill-live">🚨 New King</span>
      )}
      {crown.isHot && !crown.isNewKing && <span className="crown-pill crown-pill-hot">🔥 Hot</span>}
      {!crown.hasKing && <span className="crown-pill crown-pill-open">Open throne</span>}
    </>
  );
}

/** Large podium card — Outbid-style featured slot */
export function CrownCardFeatured({
  crown,
  onSteal,
  rank,
}: {
  crown: CrownState;
  onSteal: (c: CrownState) => void;
  rank?: number;
}) {
  const visual = crownVisual(crown.slug);

  return (
    <article
      className={`crown-slot crown-slot-featured group relative overflow-hidden rounded-[22px] ${crown.isNewKing ? "crown-new-king" : ""}`}
      style={
        {
          "--crown-accent": visual.accent,
          "--crown-accent-rgb": visual.accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="crown-slot-glow" aria-hidden />
      <div className="crown-slot-inner relative flex h-full min-h-[220px] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {rank != null && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--crown-accent)] text-[13px] font-bold text-[#0a0908]">
                #{rank}
              </span>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: visual.accent }}>
                {crown.headline}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <StatusPills crown={crown} />
              </div>
            </div>
          </div>
          <KingAvatar crown={crown} size={52} />
        </div>

        <div className="mt-auto pt-6">
          {crown.hasKing ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Current King</p>
              <p className="mt-1 truncate text-[20px] font-bold leading-tight">{crown.kingHandle}</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Throne empty</p>
              <p className="mt-1 text-[15px] font-medium text-muted">First bid takes the crown</p>
            </>
          )}

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono-label text-[40px] font-bold leading-none tabular sm:text-[48px]" style={{ color: visual.accent }}>
                {formatMoney(crown.hasKing ? crown.currentBid : crown.nextBid)}
              </p>
              {crown.hasKing && (
                <p className="mt-1.5 text-[13px] text-muted">
                  Steal at <span className="font-semibold text-foreground">{formatMoney(crown.nextBid)}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSteal(crown)}
              className="crown-steal-btn shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              {crown.hasKing ? "Outbid" : "Claim"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-muted">
          <span>
            {crown.watchers > 0 && `${crown.watchers} watching`}
            {crown.watchers > 0 && crown.bidCount > 0 && " · "}
            {crown.bidCount > 0 && `${crown.bidCount} bids`}
          </span>
          {crown.lastBidAt && <RelativeTime date={crown.lastBidAt} />}
        </div>
      </div>
    </article>
  );
}

/** Compact horizontal row — Brand My Mac table feel */
export function CrownCardRow({
  crown,
  onSteal,
  index,
}: {
  crown: CrownState;
  onSteal: (c: CrownState) => void;
  index: number;
}) {
  const visual = crownVisual(crown.slug);

  return (
    <article
      className={`crown-slot crown-slot-row group relative overflow-hidden rounded-2xl ${crown.isNewKing ? "crown-new-king" : ""}`}
      style={
        {
          "--crown-accent": visual.accent,
          "--crown-accent-rgb": visual.accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="crown-slot-glow" aria-hidden />
      <div className="crown-slot-inner relative flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:px-5 sm:py-4">
        <span className="hidden w-6 shrink-0 text-[12px] font-medium tabular text-muted sm:block">{index + 1}</span>
        <KingAvatar crown={crown} size={44} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold">{crown.name}</p>
            <StatusPills crown={crown} />
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {crown.hasKing ? (
              <>
                <span className="font-medium text-foreground">{crown.kingHandle}</span>
                {crown.lastBidAt && (
                  <>
                    {" "}
                    · <RelativeTime date={crown.lastBidAt} />
                  </>
                )}
              </>
            ) : (
              "No king yet — throne open"
            )}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <div className="text-right">
            <p className="font-mono-label text-[22px] font-bold tabular leading-none" style={{ color: visual.accent }}>
              {formatMoney(crown.hasKing ? crown.currentBid : crown.nextBid)}
            </p>
            {crown.hasKing && (
              <p className="mt-1 text-[11px] text-muted">+{formatMoney(crown.nextBid - crown.currentBid)} to steal</p>
            )}
          </div>
          <button type="button" onClick={() => onSteal(crown)} className="crown-steal-btn">
            {crown.hasKing ? "Outbid" : "Claim"}
          </button>
        </div>
      </div>
    </article>
  );
}

/** Legacy grid card — used in Most Wanted */
export function CrownCard({
  crown,
  onSteal,
  compact,
}: {
  crown: CrownState;
  onSteal: (c: CrownState) => void;
  compact?: boolean;
}) {
  if (compact) return <CrownCardRow crown={crown} onSteal={onSteal} index={0} />;
  return <CrownCardFeatured crown={crown} onSteal={onSteal} />;
}

export function CrownCardLink({ slug }: { slug: string }) {
  return (
    <Link href={`/crown/${slug}`} className="text-[12px] font-medium text-muted hover:text-[var(--crown-gold)]">
      View crown →
    </Link>
  );
}
