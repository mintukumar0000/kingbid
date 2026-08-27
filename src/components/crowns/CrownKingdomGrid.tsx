"use client";

import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import { crownVisual } from "@/lib/crown-visuals";
import { CROWN_GRID_SLOTS } from "@/lib/crown-grid-layout";

function CrownSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="crown-gold" x1="32" y1="4" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe08a" />
          <stop offset="0.45" stopColor="#c9a227" />
          <stop offset="1" stopColor="#8a6520" />
        </linearGradient>
        <filter id="crown-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M8 38h48l-4-22-10 12-6-18-6 18-10-12-4 22z"
        fill="url(#crown-gold)"
        filter="url(#crown-glow)"
      />
      <circle cx="14" cy="36" r="2.5" fill="#ffe08a" opacity="0.9" />
      <circle cx="32" cy="36" r="2.5" fill="#ffe08a" opacity="0.9" />
      <circle cx="50" cy="36" r="2.5" fill="#ffe08a" opacity="0.9" />
    </svg>
  );
}

function KingdomTile({
  crown,
  onSteal,
}: {
  crown: CrownState;
  onSteal: (c: CrownState) => void;
}) {
  const slot = CROWN_GRID_SLOTS[crown.slug];
  const visual = crownVisual(crown.slug);
  const size = slot?.size ?? "sm";
  const occupied = crown.hasKing;
  const isCenter = size === "xl";

  return (
    <button
      type="button"
      onClick={() => onSteal(crown)}
      className={[
        "kingdom-tile group",
        `kingdom-tile-${size}`,
        occupied ? "kingdom-tile-claimed" : "kingdom-tile-open",
        slot ? "" : "kingdom-tile-fallback",
        crown.isHot ? "kingdom-tile-hot" : "",
        crown.isNewKing ? "kingdom-tile-new" : "",
        isCenter ? "kingdom-tile-center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        slot
          ? ({
              gridArea: slot.area,
              "--crown-accent": visual.accent,
              "--crown-accent-rgb": visual.accentRgb,
            } as React.CSSProperties)
          : ({
              "--crown-accent": visual.accent,
              "--crown-accent-rgb": visual.accentRgb,
            } as React.CSSProperties)
      }
    >
      <span className="kingdom-tile-border" aria-hidden />
      <div className="kingdom-tile-glow" aria-hidden />
      <div className="kingdom-tile-shimmer" aria-hidden />

      <div className="relative flex h-full min-h-0 flex-col p-3 sm:p-4">
        {(crown.isHot || crown.isNewKing) && !isCenter && (
          <span className={`kingdom-badge ${crown.isNewKing ? "kingdom-badge-new" : "kingdom-badge-hot"}`}>
            {crown.isNewKing ? "New King" : "Hot"}
          </span>
        )}

        {isCenter ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="kingdom-throne">
                <span className="kingdom-throne-ring" aria-hidden />
                <span className="kingdom-throne-ring kingdom-throne-ring-2" aria-hidden />
                <CrownSvg className="kingdom-crown-svg relative z-10 h-14 w-auto sm:h-[72px]" />
              </div>
              <p
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] sm:text-[11px]"
                style={{ color: visual.accent }}
              >
                {crown.headline}
              </p>
              {occupied ? (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="kingdom-king-halo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconFor(crown.kingUrl!)}
                      alt=""
                      width={44}
                      height={44}
                      className="rounded-xl bg-surface object-cover"
                    />
                  </div>
                  <p className="max-w-full truncate text-[13px] font-semibold">{crown.kingHandle}</p>
                </div>
              ) : (
                <p className="kingdom-open-label mt-3">Throne open</p>
              )}
            </div>
            <p
              className="kingdom-price mt-auto text-center font-mono-label text-[24px] font-bold tabular sm:text-[32px]"
              style={{ color: visual.accent }}
            >
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="kingdom-icon-halo text-[18px] leading-none sm:text-[22px]" aria-hidden>
                {visual.icon}
              </span>
              {occupied && crown.kingUrl && (
                <div className="kingdom-king-halo kingdom-king-halo-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={faviconFor(crown.kingUrl)}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-lg bg-surface object-cover"
                  />
                </div>
              )}
            </div>
            <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/95 sm:text-[11px]">
              {slot?.label ?? crown.name}
            </p>
            {occupied ? (
              <p className="mt-0.5 truncate text-[11px] text-muted">{crown.kingHandle}</p>
            ) : (
              <p className="kingdom-open-label mt-0.5 text-[9px] sm:text-[10px]">Available</p>
            )}
            <p
              className="kingdom-price mt-auto pt-2 font-mono-label text-[16px] font-bold tabular leading-none sm:text-[19px]"
              style={{ color: visual.accent }}
            >
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
            <span className="kingdom-tile-cta mt-2 text-[9px] font-bold uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-[10px]">
              {occupied ? "Outbid →" : "Claim →"}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

function KingdomBackdrop() {
  return (
    <div className="kingdom-backdrop" aria-hidden>
      <div className="kingdom-aurora" />
      <div className="kingdom-grid-lines" />
      <div className="kingdom-orb kingdom-orb-1" />
      <div className="kingdom-orb kingdom-orb-2" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="kingdom-star" style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

export function CrownKingdomGrid({
  crowns,
  onSteal,
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
}) {
  const useFullMap = crowns.length >= 12;

  return (
    <div className="kingdom-stage group/stage">
      <KingdomBackdrop />
      <div className="kingdom-stage-ring" aria-hidden />
      <div className="kingdom-stage-scanline" aria-hidden />
      <div className={useFullMap ? "kingdom-grid" : "kingdom-grid-compact"}>
        {crowns.map((crown) => (
          <KingdomTile key={crown.slug} crown={crown} onSteal={onSteal} />
        ))}
      </div>
      <p className="kingdom-hint mt-5 text-center text-[12px] tracking-wide text-muted">
        <span className="text-[var(--crown-gold)]">✦</span> Tap any jewel to claim or outbid{" "}
        <span className="text-[var(--crown-gold)]">✦</span>
      </p>
    </div>
  );
}
