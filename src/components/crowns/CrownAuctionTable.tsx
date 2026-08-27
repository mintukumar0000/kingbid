"use client";

import Link from "next/link";
import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import type { CrownGroup } from "@/lib/crowns";
import { crownVisual } from "@/lib/crown-visuals";
import { RelativeTime } from "@/components/RelativeTime";

const GROUP_LABELS: Record<CrownGroup, string> = {
  tech: "Tech Crowns",
  places: "Kingdom · Places",
  internet: "Internet Crowns",
};

function HolderCell({ crown }: { crown: CrownState }) {
  const visual = crownVisual(crown.slug);

  if (!crown.hasKing) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface-2 text-lg"
          style={{ color: visual.accent }}
        >
          *
        </div>
        <div>
          <p className="text-[13px] font-semibold text-muted">Available</p>
          <p className="text-[11px] text-muted/80">Be first to claim</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {crown.kingUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconFor(crown.kingUrl)}
          alt=""
          width={40}
          height={40}
          className="rounded-xl bg-surface ring-1 ring-white/10"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-lg">{visual.icon}</div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold">{crown.kingHandle}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--crown-gold)]">Current King</p>
      </div>
    </div>
  );
}

function AuctionRow({
  crown,
  index,
  onSteal,
}: {
  crown: CrownState;
  index: number;
  onSteal: (c: CrownState) => void;
}) {
  const visual = crownVisual(crown.slug);

  return (
    <div className="auction-row group">
      <div className="auction-row-main">
        <div className="auction-col-spot">
          <span className="auction-rank">{index + 1}</span>
          <div className="min-w-0">
            <Link href={`/crown/${crown.slug}`} className="truncate text-[15px] font-bold hover:text-[var(--crown-gold)]">
              {crown.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="auction-size-pill">{crown.group}</span>
              {crown.isNewKing && <span className="crown-pill crown-pill-live">New King</span>}
              {crown.isHot && !crown.isNewKing && <span className="crown-pill crown-pill-hot">Hot</span>}
            </div>
          </div>
        </div>

        <div className="auction-col-held hidden md:block">
          <HolderCell crown={crown} />
        </div>

        <div className="auction-col-bid">
          <p className="font-mono-label text-[24px] font-bold tabular leading-none" style={{ color: visual.accent }}>
            {formatMoney(crown.hasKing ? crown.currentBid : crown.nextBid)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {crown.bidCount > 0 ? `${crown.bidCount} bids` : "starting bid"}
            {crown.watchers > 0 && ` · ${crown.watchers} watching`}
          </p>
        </div>

        <div className="auction-col-action">
          <button type="button" onClick={() => onSteal(crown)} className="auction-claim-btn">
            {crown.hasKing ? `Outbid ${formatMoney(crown.nextBid)}` : `Claim ${formatMoney(crown.nextBid)}`}
          </button>
        </div>
      </div>

      {/* Mobile held-by */}
      <div className="auction-row-mobile-held md:hidden">
        <HolderCell crown={crown} />
      </div>

      {/* Previous king — rankbid style */}
      {crown.previousKing && (
        <div className="auction-row-previous">
          <span className="text-[11px] uppercase tracking-wide text-muted">Previous</span>
          <span className="truncate text-[13px] text-muted">{crown.previousKing.handle}</span>
          <span className="ml-auto tabular text-[13px] text-muted">{formatMoney(crown.previousKing.bid)}</span>
        </div>
      )}

      {crown.lastBidAt && (
        <p className="auction-row-time">
          Last bid <RelativeTime date={crown.lastBidAt} />
        </p>
      )}
    </div>
  );
}

export function CrownAuctionTable({
  crowns,
  onSteal,
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
}) {
  const groups: CrownGroup[] = ["tech", "places", "internet"];
  let rowIndex = 0;

  return (
    <div className="auction-table">
      <div className="auction-table-head hidden md:grid">
        <span>Crown</span>
        <span>Held by</span>
        <span>Top bid</span>
        <span />
      </div>

      {groups.map((group) => {
        const groupCrowns = crowns.filter((c) => c.group === group);
        if (!groupCrowns.length) return null;

        return (
          <section key={group} className="auction-group">
            <h3 className="auction-group-title">{GROUP_LABELS[group]}</h3>
            <div className="auction-group-rows">
              {groupCrowns.map((crown) => {
                const idx = rowIndex++;
                return <AuctionRow key={crown.slug} crown={crown} index={idx} onSteal={onSteal} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
