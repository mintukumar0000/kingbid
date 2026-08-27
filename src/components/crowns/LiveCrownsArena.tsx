"use client";

import { useState } from "react";
import type { CrownState } from "@/lib/crowns-data";
import { formatMoney } from "@/lib/format";
import { CrownKingdomGrid } from "@/components/crowns/CrownKingdomGrid";
import { CrownAuctionTable } from "@/components/crowns/CrownAuctionTable";

type View = "kingdom" | "auction";

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
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
}) {
  const [view, setView] = useState<View>("kingdom");

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
      {/* Live stats — glass chips */}
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

      {/* Headline + view toggle */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <p className="kb-eyebrow mb-3 opacity-80">Live digital thrones</p>
          <h3 className="arena-headline font-display text-[30px] font-semibold leading-[1.08] sm:text-[42px]">
            Put your brand on{" "}
            <span className="arena-headline-glow relative inline-block">
              <span className="relative z-10">the crown.</span>
              <span className="crown-headline-mark absolute -inset-x-2 bottom-0 top-[50%] -skew-y-1 rounded-sm" aria-hidden />
            </span>
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            Fourteen live jewels. One kingdom. Highest bid wears the crown until someone steals it.
          </p>
        </div>

        <div className="arena-toggle">
          <button
            type="button"
            onClick={() => setView("kingdom")}
            className={`arena-toggle-btn ${view === "kingdom" ? "arena-toggle-active" : ""}`}
          >
            <span aria-hidden>👑</span> Kingdom map
          </button>
          <button
            type="button"
            onClick={() => setView("auction")}
            className={`arena-toggle-btn ${view === "auction" ? "arena-toggle-active" : ""}`}
          >
            The auction, live
          </button>
        </div>
      </div>

      {/* Live bar */}
      <div className="arena-live-bar">
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[13px] font-semibold tracking-wide">Live auction</span>
          <span className="text-[12px] text-muted">· ongoing, no deadline</span>
        </div>
        <p className="text-[12px] text-muted">
          {view === "kingdom" ? "Tap any jewel to bid" : "Outbid any crown anytime"}
        </p>
      </div>

      {view === "kingdom" ? (
        <CrownKingdomGrid crowns={crowns} onSteal={onSteal} />
      ) : (
        <CrownAuctionTable crowns={crowns} onSteal={onSteal} />
      )}
    </div>
  );
}
