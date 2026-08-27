"use client";

import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import { crownVisual } from "@/lib/crown-visuals";
import { CROWN_GRID_SLOTS } from "@/lib/crown-grid-layout";

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

  return (
    <button
      type="button"
      onClick={() => onSteal(crown)}
      className={`kingdom-tile kingdom-tile-${size} group relative overflow-hidden rounded-2xl text-left transition-all ${occupied ? "kingdom-tile-claimed" : "kingdom-tile-open"} ${slot ? "" : "kingdom-tile-fallback"}`}
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
      <div className="kingdom-tile-glow" aria-hidden />
      <div className="relative flex h-full min-h-0 flex-col p-3 sm:p-4">
        {size === "xl" ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="kingdom-crown-icon text-[48px] leading-none sm:text-[64px]" aria-hidden>
                👑
              </span>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: visual.accent }}>
                {crown.headline}
              </p>
              {occupied ? (
                <div className="mt-3 flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={faviconFor(crown.kingUrl!)}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-xl bg-surface ring-2 ring-white/15"
                  />
                  <p className="max-w-full truncate text-[13px] font-semibold">{crown.kingHandle}</p>
                </div>
              ) : (
                <p className="mt-3 text-[12px] font-medium text-muted">Throne open</p>
              )}
            </div>
            <p className="mt-auto text-center font-mono-label text-[22px] font-bold tabular sm:text-[28px]" style={{ color: visual.accent }}>
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[18px] leading-none sm:text-[20px]" aria-hidden>
                {visual.icon}
              </span>
              {occupied && crown.kingUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconFor(crown.kingUrl)}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-lg bg-surface ring-1 ring-white/10"
                />
              )}
            </div>
            <p className="mt-2 truncate text-[11px] font-bold uppercase tracking-wide text-foreground/90">
              {slot?.label ?? crown.name}
            </p>
            {occupied ? (
              <p className="mt-0.5 truncate text-[11px] text-muted">{crown.kingHandle}</p>
            ) : (
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Available</p>
            )}
            <p className="mt-auto pt-2 font-mono-label text-[16px] font-bold tabular leading-none sm:text-[18px]" style={{ color: visual.accent }}>
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
            <span className="kingdom-tile-cta mt-2 text-[10px] font-bold uppercase tracking-wide opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {occupied ? "Outbid →" : "Claim →"}
            </span>
          </>
        )}
      </div>
    </button>
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
    <div className="kingdom-stage">
      <div className="kingdom-stage-ring" aria-hidden />
      <div className={useFullMap ? "kingdom-grid" : "kingdom-grid-compact"}>
        {crowns.map((crown) => (
          <KingdomTile key={crown.slug} crown={crown} onSteal={onSteal} />
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-muted">Tap any jewel to claim or outbid</p>
    </div>
  );
}
