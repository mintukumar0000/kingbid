"use client";

import Link from "next/link";
import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState } from "@/lib/crowns-data";
import type { CrownGroup } from "@/lib/crowns";
import { crownVisual } from "@/lib/crown-visuals";
import { RelativeTime } from "@/components/RelativeTime";

const GROUP_LABELS: Record<CrownGroup, string> = {
  tech: "Tech",
  places: "Places",
  internet: "Internet",
};

function HolderCell({ crown }: { crown: CrownState }) {
  const visual = crownVisual(crown.slug);

  if (!crown.hasKing) {
    return (
      <div className="crown-held-cell">
        <div className="crown-held-empty" style={{ color: visual.accent }}>
          *
        </div>
        <div>
          <p className="crown-held-name text-muted">Available</p>
          <p className="crown-held-sub">Be first to claim</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crown-held-cell">
      {crown.kingUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faviconFor(crown.kingUrl)} alt="" width={36} height={36} className="crown-held-avatar" />
      ) : (
        <div className="crown-held-empty text-lg">{visual.icon}</div>
      )}
      <div className="min-w-0">
        <p className="crown-held-name truncate">{crown.kingHandle}</p>
        <p className="crown-held-sub text-[var(--crown-gold)]">Current king</p>
      </div>
    </div>
  );
}

function SpotCell({ crown, index }: { crown: CrownState; index: number }) {
  const visual = crownVisual(crown.slug);
  return (
    <div className="crown-spot-cell">
      <span className="crown-spot-rank">{index + 1}</span>
      <span className="crown-spot-icon" style={{ color: visual.accent }}>
        {crown.flag ?? visual.icon}
      </span>
      <div className="min-w-0">
        <Link href={`/crown/${crown.slug}`} className="crown-spot-name truncate hover:text-[var(--crown-gold)]">
          {crown.name}
        </Link>
        <p className="crown-spot-sub truncate">{crown.headline}</p>
      </div>
    </div>
  );
}

function CrownTableRow({
  crown,
  index,
  onSteal,
  showGroup,
  showToday,
}: {
  crown: CrownState;
  index: number;
  onSteal: (c: CrownState) => void;
  showGroup?: boolean;
  showToday?: boolean;
}) {
  const visual = crownVisual(crown.slug);

  return (
    <div className="crown-table-row">
      <div className={`crown-table-row-inner ${showGroup ? "crown-table-row-grouped" : ""}`}>
        <div className="crown-table-col crown-table-col-spot">
          <SpotCell crown={crown} index={index} />
        </div>

        {showGroup && (
          <div className="crown-table-col crown-table-col-type hidden lg:flex">
            <span className="crown-type-pill">{GROUP_LABELS[crown.group]}</span>
          </div>
        )}

        <div className="crown-table-col crown-table-col-held hidden md:flex">
          <HolderCell crown={crown} />
        </div>

        {showToday ? (
          <div className="crown-table-col crown-table-col-bid">
            <p className="crown-bid-amount tabular" style={{ color: visual.accent }}>
              +{formatMoney(crown.bidDeltaToday)}
            </p>
            <p className="crown-bid-meta">last 24h</p>
          </div>
        ) : (
          <div className="crown-table-col crown-table-col-bid">
            <p className="crown-bid-amount tabular" style={{ color: visual.accent }}>
              {formatMoney(crown.hasKing ? crown.currentBid : crown.nextBid)}
            </p>
            <p className="crown-bid-meta">
              {crown.bidCount > 0 ? `${crown.bidCount} bids` : "starting bid"}
              {crown.watchers > 0 && ` · ${crown.watchers} watching`}
            </p>
          </div>
        )}

        <div className="crown-table-col crown-table-col-action">
          <button type="button" onClick={() => onSteal(crown)} className="crown-table-outbid">
            {crown.hasKing ? "Outbid" : "Claim"}
          </button>
        </div>
      </div>

      <div className="crown-table-mobile-held md:hidden">
        <HolderCell crown={crown} />
      </div>

      {(crown.isHot || crown.isNewKing || !crown.hasKing) && (
        <div className="crown-table-tags">
          {!crown.hasKing && <span className="crowns-pill crowns-pill-open">Open</span>}
          {crown.isNewKing && <span className="crown-pill crown-pill-live">New king</span>}
          {crown.isHot && !crown.isNewKing && <span className="crown-pill crown-pill-hot">Hot</span>}
          {showGroup && (
            <span className="crown-type-pill lg:hidden">{GROUP_LABELS[crown.group]}</span>
          )}
        </div>
      )}

      {crown.previousKing && (
        <div className="crown-table-previous">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Previous</span>
          <span className="truncate text-[12px] text-muted">{crown.previousKing.handle}</span>
          <span className="ml-auto tabular text-[12px] text-muted">{formatMoney(crown.previousKing.bid)}</span>
        </div>
      )}

      {crown.lastBidAt && (
        <p className="crown-table-time">
          Last bid <RelativeTime date={crown.lastBidAt} />
        </p>
      )}
    </div>
  );
}

export function CrownLiveTable({
  crowns,
  onSteal,
  showGroup = false,
  showToday = false,
  groupSections,
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
  showGroup?: boolean;
  showToday?: boolean;
  /** When set, renders grouped sections (all view). Otherwise flat list. */
  groupSections?: CrownGroup[];
}) {
  if (!crowns.length) {
    return (
      <div className="crown-live-table crown-live-table-empty">
        <p className="py-12 text-center text-[14px] text-muted">No crowns in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="crown-live-table">
      <div
        className={`crown-table-header hidden md:grid ${showGroup ? "crown-table-header-grouped" : ""}`}
      >
        <span>Crown</span>
        {showGroup && <span className="hidden lg:block">Category</span>}
        <span>Held by</span>
        <span>{showToday ? "Today" : "Top bid"}</span>
        <span />
      </div>

      {groupSections ? (
        groupSections.map((group) => {
          const groupCrowns = crowns.filter((c) => c.group === group);
          if (!groupCrowns.length) return null;
          const labels: Record<CrownGroup, string> = {
            tech: "Tech crowns",
            places: "Kingdom · Places",
            internet: "Internet crowns",
          };
          return (
            <section key={group} className="crown-table-section">
              <h3 className="crown-table-section-title">{labels[group]}</h3>
              {groupCrowns.map((crown, i) => (
                <CrownTableRow
                  key={crown.slug}
                  crown={crown}
                  index={i}
                  onSteal={onSteal}
                  showGroup={showGroup}
                  showToday={showToday}
                />
              ))}
            </section>
          );
        })
      ) : (
        <div className="crown-table-section">
          {crowns.map((crown, i) => (
            <CrownTableRow
              key={crown.slug}
              crown={crown}
              index={i}
              onSteal={onSteal}
              showGroup={showGroup}
              showToday={showToday}
            />
          ))}
        </div>
      )}
    </div>
  );
}
