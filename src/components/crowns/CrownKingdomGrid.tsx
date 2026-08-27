"use client";

import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import { crownVisual } from "@/lib/crown-visuals";
import { CrownImage } from "@/components/crowns/CrownImage";
import {
  GRID_CSS_CLASS,
  gridSlotsForVariant,
  type CrownGridSlot,
  type GridVariant,
} from "@/lib/crown-grid-layout";

function TileMeta({ crown, occupied, centered }: { crown: CrownState; occupied: boolean; centered?: boolean }) {
  const align = centered ? "text-center" : "";
  if (occupied) {
    return (
      <div className={`mt-1 space-y-0.5 ${align}`}>
        {crown.kingTitle && (
          <p className="truncate text-[11px] font-semibold text-foreground">{crown.kingTitle}</p>
        )}
        {(crown.kingDescription || crown.kingHandle) && (
          <p className="line-clamp-2 text-[10px] leading-snug text-muted">
            {crown.kingDescription || crown.kingHandle}
          </p>
        )}
        {crown.clickCount > 0 && (
          <p className="text-[10px] font-medium tabular text-muted">{crown.clickCount.toLocaleString()} clicks</p>
        )}
      </div>
    );
  }
  return (
    <p className={`mt-1 line-clamp-2 text-[10px] leading-snug text-muted ${align}`}>{crown.description}</p>
  );
}

function KingdomTile({
  crown,
  onSteal,
  slot,
  variant,
}: {
  crown: CrownState;
  onSteal: (c: CrownState) => void;
  slot?: CrownGridSlot;
  variant: GridVariant;
}) {
  const visual = crownVisual(crown.slug);
  const size = slot?.size ?? "sm";
  const occupied = crown.hasKing;
  const isCenter = size === "xl";
  const isTerritory = variant === "places" && size === "lg";
  const isCategory = variant !== "all";

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
        isTerritory ? "kingdom-tile-territory" : "",
        isCategory && !isCenter && !isTerritory ? "kingdom-tile-category" : "",
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
        {(crown.isHot || crown.isNewKing) && !isCenter && !isTerritory && (
          <span className={`kingdom-badge ${crown.isNewKing ? "kingdom-badge-new" : "kingdom-badge-hot"}`}>
            {crown.isNewKing ? "New King" : "Hot"}
          </span>
        )}

        {isTerritory ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="text-[36px] leading-none sm:text-[42px]">{crown.flag}</span>
              <div className="mt-2 flex items-center gap-1.5">
                <CrownImage size="xs" glow />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{crown.headline}</p>
              </div>
              {occupied ? (
                <div className="mt-3 flex w-full flex-col items-center gap-2 px-2">
                  <div className="kingdom-king-halo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconFor(crown.kingUrl!)}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-xl bg-surface object-cover"
                    />
                  </div>
                  <TileMeta crown={crown} occupied centered />
                </div>
              ) : (
                <>
                  <p className="kingdom-open-label mt-3">Unclaimed</p>
                  <TileMeta crown={crown} occupied={false} centered />
                </>
              )}
            </div>
            <p
              className="kingdom-price mt-auto text-center font-mono-label text-[22px] font-bold tabular sm:text-[28px]"
              style={{ color: visual.accent }}
            >
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
            <span className="kingdom-tile-cta mt-2 text-center text-[9px] font-bold uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-[10px]">
              {occupied ? "Outbid →" : "Claim →"}
            </span>
          </>
        ) : isCenter ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="kingdom-throne">
                <span className="kingdom-throne-ring" aria-hidden />
                <span className="kingdom-throne-ring kingdom-throne-ring-2" aria-hidden />
                <span className="kingdom-throne-beam" aria-hidden />
                <CrownImage size="hero" float glow className="relative z-10" />
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
                  {crown.clickCount > 0 && (
                    <p className="text-[10px] tabular text-muted">{crown.clickCount.toLocaleString()} clicks</p>
                  )}
                  {crown.kingDescription && (
                    <p className="line-clamp-2 max-w-full px-2 text-[10px] text-muted">{crown.kingDescription}</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="kingdom-open-label mt-3">Throne open</p>
                  <p className="mt-2 line-clamp-2 max-w-full px-2 text-[10px] text-muted">{crown.description}</p>
                </>
              )}
            </div>
            <p
              className="kingdom-price mt-auto text-center font-mono-label text-[24px] font-bold tabular sm:text-[32px]"
              style={{ color: visual.accent }}
            >
              {formatMoney(occupied ? crown.currentBid : crown.nextBid)}
            </p>
            <span className="kingdom-tile-cta mt-2 text-center text-[9px] font-bold uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-[10px]">
              {occupied ? "Outbid →" : "Claim →"}
            </span>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="kingdom-icon-halo" aria-hidden>
                <CrownImage size="sm" glow />
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
              <TileMeta crown={crown} occupied />
            ) : (
              <>
                <p className="kingdom-open-label mt-0.5 text-[9px] sm:text-[10px]">Available</p>
                <TileMeta crown={crown} occupied={false} />
              </>
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

function KingdomBackdrop({ variant }: { variant: GridVariant }) {
  return (
    <div className="kingdom-backdrop" aria-hidden>
      <div className={`kingdom-aurora ${variant !== "all" ? `kingdom-aurora-${variant}` : ""}`} />
      <div className="kingdom-grid-lines" />
      <div className="kingdom-orb kingdom-orb-1" />
      <div className="kingdom-orb kingdom-orb-2" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="kingdom-star" style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

const HINT: Record<GridVariant, string> = {
  all: "Tap any jewel to claim or outbid",
  tech: "Tap any tech throne to claim or outbid",
  places: "Tap any territory to claim or outbid",
  internet: "Tap any platform throne to claim or outbid",
};

export function CrownKingdomGrid({
  crowns,
  onSteal,
  variant = "all",
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
  variant?: GridVariant;
}) {
  const slots = gridSlotsForVariant(variant);
  const gridClass = GRID_CSS_CLASS[variant];

  return (
    <div className={`kingdom-stage group/stage kingdom-stage-${variant}`}>
      <KingdomBackdrop variant={variant} />
      <div className="kingdom-stage-ring" aria-hidden />
      <div className="kingdom-stage-scanline" aria-hidden />
      <div className={gridClass}>
        {crowns.map((crown) => (
          <KingdomTile
            key={crown.slug}
            crown={crown}
            onSteal={onSteal}
            slot={slots[crown.slug]}
            variant={variant}
          />
        ))}
      </div>
      <p className="kingdom-hint mt-5 text-center text-[12px] tracking-wide text-muted">
        <span className="text-[var(--crown-gold)]">✦</span> {HINT[variant]}{" "}
        <span className="text-[var(--crown-gold)]">✦</span>
      </p>
    </div>
  );
}
