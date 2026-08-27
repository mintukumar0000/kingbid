"use client";

import { useMemo } from "react";
import type { CrownState } from "@/lib/crowns-data";
import type { CrownGroup } from "@/lib/crowns";
import { formatMoney } from "@/lib/format";
import { CrownKingdomGrid } from "@/components/crowns/CrownKingdomGrid";
import { CrownLiveTable } from "@/components/crowns/CrownLiveTable";
import { gridVariantForFilter } from "@/lib/crown-grid-layout";

export type ArenaFilter = "all" | "trending" | CrownGroup;

const CATEGORY_META: Record<
  Exclude<ArenaFilter, "all">,
  { eyebrow: string; title: string; description: string }
> = {
  trending: {
    eyebrow: "Momentum",
    title: "Trending crowns, live.",
    description: "Most bid activity in the last 24 hours — steal any throne.",
  },
  tech: {
    eyebrow: "Tech verticals",
    title: "Tech crowns, live.",
    description: "AI, SaaS, startups, dev tools — bid for the throne in your category.",
  },
  places: {
    eyebrow: "Territories",
    title: "Places crowns, live.",
    description: "Fictional digital titles — not real-world sovereignty.",
  },
  internet: {
    eyebrow: "Platforms",
    title: "Internet crowns, live.",
    description: "X, Threads, and the open web — claim your platform throne.",
  },
};

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="arena-stat-chip">
      <span className={`arena-stat-value ${accent ? "arena-stat-gold" : ""}`}>{value}</span>
      <span className="arena-stat-label">{label}</span>
    </div>
  );
}

export function LiveCrownsArena({
  crowns,
  onSteal,
  filter = "all",
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
  filter?: ArenaFilter;
}) {
  const gridVariant = gridVariantForFilter(filter);
  const isFullKingdom = filter === "all" && crowns.length >= 12;
  const isCategoryGrid = gridVariant !== null && gridVariant !== "all";
  const categoryMeta = filter !== "all" ? CATEGORY_META[filter] : null;

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

  const claimed = crowns.filter((c) => c.hasKing).length;
  const totalRaised = crowns.filter((c) => c.hasKing).reduce((s, c) => s + c.currentBid, 0);
  const totalWatching = crowns.reduce((s, c) => s + c.watchers, 0);
  const totalBids = crowns.reduce((s, c) => s + c.bidCount, 0);

  return (
    <div className="arena-shell space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <StatChip label="raised" value={formatMoney(totalRaised)} accent />
        <StatChip
          label={totalWatching > 0 ? "watching" : "bids placed"}
          value={String(totalWatching || totalBids)}
        />
        <div className="arena-stat-chip arena-stat-live">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green" />
          <span className="arena-stat-value arena-stat-gold">
            {claimed}/{crowns.length}
          </span>
          <span className="arena-stat-label">claimed</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="kb-eyebrow mb-3 opacity-80">
            {categoryMeta?.eyebrow ?? "Live digital thrones"}
          </p>
          <h3 className="arena-headline font-display text-[28px] font-semibold leading-[1.08] sm:text-[38px]">
            {categoryMeta ? (
              categoryMeta.title
            ) : (
              <>
                Put your brand on{" "}
                <span className="arena-headline-glow relative inline-block">
                  <span className="relative z-10">the crown.</span>
                  <span className="crown-headline-mark absolute -inset-x-2 bottom-0 top-[50%] -skew-y-1 rounded-sm" aria-hidden />
                </span>
              </>
            )}
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            {categoryMeta?.description ??
              "Fourteen live jewels. One kingdom. Highest bid wears the crown until someone steals it."}
          </p>
        </div>
      </div>

      <div className="arena-live-bar">
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[13px] font-semibold tracking-wide">Live auction</span>
          <span className="text-[12px] text-muted">· ongoing, no deadline</span>
        </div>
        <p className="text-[12px] text-muted">
          {isFullKingdom || isCategoryGrid
            ? "Bento map + live table below"
            : "Tap outbid on any row"}
        </p>
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
