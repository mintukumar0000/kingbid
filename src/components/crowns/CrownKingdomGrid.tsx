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

function StatusBadge({ open }: { open: boolean }) {
  return (
    <span className={`kingdom-status ${open ? "kingdom-status-open" : "kingdom-status-claimed"}`}>
      {open ? "Open" : "Claimed"}
    </span>
  );
}

function TileFooter({
  price,
  accent,
  occupied,
}: {
  price: string;
  accent: string;
  occupied: boolean;
}) {
  return (
    <div className="kingdom-tile-foot">
      <p className="kingdom-price font-mono-label text-[18px] font-semibold tabular sm:text-[20px]" style={{ color: accent }}>
        {price}
      </p>
      <span className="kingdom-tile-cta text-[11px] font-medium text-muted group-hover:text-[var(--crown-gold)]">
        {occupied ? "Outbid →" : "Claim →"}
      </span>
    </div>
  );
}
function TileMeta({ crown, occupied, centered }: { crown: CrownState; occupied: boolean; centered?: boolean }) {
  const align = centered ? "text-center" : "";
  if (occupied) {
    return (
      <div className={`mt-2 space-y-1 ${align}`}>
        {crown.kingTitle && (
          <p className="truncate text-[12px] font-semibold text-foreground">{crown.kingTitle}</p>
        )}
        {(crown.kingDescription || crown.kingHandle) && (
          <p className="line-clamp-2 text-[11px] leading-snug text-muted">
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
    <p className={`mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted ${align}`}>{crown.description}</p>
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
      <span className="kingdom-tile-wash" aria-hidden />
      <div className="kingdom-tile-glow" aria-hidden />
      <div className="kingdom-tile-shimmer" aria-hidden />

      <div className="kingdom-tile-inner">
        {(crown.isHot || crown.isNewKing) && !isCenter && !isTerritory && (
          <span className={`kingdom-badge ${crown.isNewKing ? "kingdom-badge-new" : "kingdom-badge-hot"}`}>
            {crown.isNewKing ? "New King" : "Hot"}
          </span>
        )}

        {isTerritory ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="text-[36px] leading-none sm:text-[42px]">{crown.flag}</span>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em]">{crown.headline}</p>
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
                  <div className="mt-3">
                    <StatusBadge open />
                  </div>
                  <TileMeta crown={crown} occupied={false} centered />
                </>
              )}
            </div>
            <TileFooter
              price={formatMoney(occupied ? crown.currentBid : crown.nextBid)}
              accent={visual.accent}
              occupied={occupied}
            />
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
                className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
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
                  <TileMeta crown={crown} occupied centered />
                </div>
              ) : (
                <>
                  <div className="mt-3">
                    <StatusBadge open />
                  </div>
                  <TileMeta crown={crown} occupied={false} centered />
                </>
              )}
            </div>
            <TileFooter
              price={formatMoney(occupied ? crown.currentBid : crown.nextBid)}
              accent={visual.accent}
              occupied={occupied}
            />
          </>
        ) : (
          <>
            <div className="kingdom-tile-head">
              <p className="kingdom-tile-label" style={{ color: visual.accent }}>
                {slot?.label ?? crown.name}
              </p>
              <div className="flex items-center gap-2">
                {occupied && crown.kingUrl && (
                  <div className="kingdom-king-halo kingdom-king-halo-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconFor(crown.kingUrl)}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded-md bg-surface object-cover"
                    />
                  </div>
                )}
                <StatusBadge open={!occupied} />
              </div>
            </div>
            <div className="kingdom-tile-body">
              <TileMeta crown={crown} occupied={occupied} />
            </div>
            <TileFooter
              price={formatMoney(occupied ? crown.currentBid : crown.nextBid)}
              accent={visual.accent}
              occupied={occupied}
            />
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
      <p className="kingdom-hint mt-5 text-center text-[13px] text-muted">
        {HINT[variant]}
      </p>
    </div>
  );
}
