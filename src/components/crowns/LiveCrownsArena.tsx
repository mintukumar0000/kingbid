"use client";

import { useMemo } from "react";
import type { CrownState } from "@/lib/crowns-data";
import type { CrownGroup } from "@/lib/crowns";
import { CrownKingdomGrid } from "@/components/crowns/CrownKingdomGrid";
import { CrownLiveTable } from "@/components/crowns/CrownLiveTable";
import { gridVariantForFilter } from "@/lib/crown-grid-layout";

export type ArenaFilter = "all" | "trending" | CrownGroup;

const FILTERS: { id: ArenaFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "tech", label: "Tech" },
  { id: "places", label: "Places" },
  { id: "internet", label: "Internet" },
];

function LiveAuctionHeading() {
  return (
    <div className="arena-live-heading">
      <span className="pulse-dot h-2 w-2 rounded-full bg-green" aria-hidden />
      <span>Live auction</span>
    </div>
  );
}

export function LiveCrownsArena({
  crowns,
  onSteal,
  filter = "all",
  onFilterChange,
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
  filter?: ArenaFilter;
  onFilterChange: (filter: ArenaFilter) => void;
}) {
  const gridVariant = gridVariantForFilter(filter);
  const isFullKingdom = filter === "all" && crowns.length >= 12;
  const isCategoryGrid = gridVariant !== null && gridVariant !== "all";
  const showBento = isFullKingdom || isCategoryGrid;

  const sortedCrowns = useMemo(() => {
    if (filter === "trending") {
      return [...crowns].sort((a, b) => b.bidDeltaToday - a.bidDeltaToday);
    }
    return crowns;
  }, [crowns, filter]);

  if (!crowns.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted">
        Loading crowns…
      </div>
    );
  }

  return (
    <div className="arena-shell space-y-6">
      <div className="crowns-arena-top">
        <nav className="crowns-filter-nav" aria-label="Crown categories">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={`crowns-filter-btn ${filter === f.id ? "crowns-filter-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </nav>
        {showBento && <LiveAuctionHeading />}
      </div>

      {isFullKingdom ? (
        <>
          <CrownKingdomGrid crowns={crowns} onSteal={onSteal} variant="all" />
          <div className="space-y-3">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Or browse the full auction
            </p>
            <CrownLiveTable
              crowns={crowns}
              onSteal={onSteal}
              showGroup
              groupSections={["tech", "places", "internet"]}
            />
          </div>
        </>
      ) : isCategoryGrid ? (
        <>
          <CrownKingdomGrid crowns={crowns} onSteal={onSteal} variant={gridVariant} />
          <div className="space-y-3">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Or browse the live table
            </p>
            <CrownLiveTable crowns={sortedCrowns} onSteal={onSteal} />
          </div>
        </>
      ) : (
        <CrownLiveTable
          crowns={sortedCrowns}
          onSteal={onSteal}
          showToday={filter === "trending"}
        />
      )}
    </div>
  );
}
