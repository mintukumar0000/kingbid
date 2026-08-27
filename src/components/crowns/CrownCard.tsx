"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import { RelativeTime } from "@/components/RelativeTime";

const THEME_STYLES = {
  tech: "border-[#2a3344] bg-gradient-to-b from-[#141820] to-[#0f1218] hover:border-[#3d4f6a]",
  places: "border-[#3a3228] bg-gradient-to-b from-[#1a1612] to-[#12100e] hover:border-[#5c4a32]",
  internet: "border-[#2e2838] bg-gradient-to-b from-[#16121c] to-[#100e14] hover:border-[#4a3d58]",
} as const;

export function CrownCard({
  crown,
  onSteal,
  compact,
}: {
  crown: CrownState;
  onSteal: (crown: CrownState) => void;
  compact?: boolean;
}) {
  const themeClass = THEME_STYLES[crown.theme];

  return (
    <article
      className={`crown-card group relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${themeClass} ${
        crown.isNewKing ? "crown-new-king ring-1 ring-[var(--crown-gold)]/40" : ""
      }`}
    >
      {crown.isNewKing && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--crown-gold)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0a0908]">
          🚨 New King
        </span>
      )}
      {crown.isHot && !crown.isNewKing && (
        <span className="absolute -top-2.5 right-4 rounded-full border border-[var(--crown-gold)]/50 bg-[#1a1612] px-2.5 py-0.5 text-[10px] font-bold text-[var(--crown-gold)]">
          🔥 HOT
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--crown-gold)]">
            {crown.flag ? `${crown.flag} ` : "👑 "}
            {crown.headline}
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {crown.hasKing ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Current King</p>
            <p className="mt-1 truncate text-[17px] font-bold text-foreground">{crown.kingHandle}</p>
            <p className="font-mono-label mt-3 text-[32px] font-bold leading-none tabular text-[var(--crown-gold)] sm:text-[36px]">
              {formatMoney(crown.currentBid)}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Next bid{" "}
              <span className="font-semibold text-foreground">{formatMoney(crown.nextBid)}</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">No King yet</p>
            <p className="mt-2 text-[14px] leading-snug text-muted">Be the first to claim the crown.</p>
            <p className="font-mono-label mt-4 text-[28px] font-bold tabular text-[var(--crown-gold)]">
              {formatMoney(crown.nextBid)}
            </p>
            <p className="mt-1 text-[12px] text-muted">Starting bid</p>
          </>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={() => onSteal(crown)}
          className="w-full rounded-full bg-[var(--crown-gold)] py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#0a0908] transition-all hover:brightness-110 active:scale-[0.99]"
        >
          {crown.hasKing ? "🔥 Steal the Crown" : "👑 Claim the Crown"}
        </button>
        <Link
          href={`/crown/${crown.slug}`}
          className="block text-center text-[12px] font-medium text-muted transition-colors hover:text-[var(--crown-gold)]"
        >
          View crown →
        </Link>
      </div>

      {!compact && (
        <p className="mt-4 border-t border-border/60 pt-3 text-[11px] text-muted">
          {crown.watchers > 0 && <span>{crown.watchers} watching</span>}
          {crown.watchers > 0 && crown.bidCount > 0 && <span> · </span>}
          {crown.bidCount > 0 && <span>{crown.bidCount} bids</span>}
          {crown.lastBidAt && (
            <>
              {(crown.watchers > 0 || crown.bidCount > 0) && <span> · </span>}
              <RelativeTime date={crown.lastBidAt} />
            </>
          )}
        </p>
      )}
    </article>
  );
}
