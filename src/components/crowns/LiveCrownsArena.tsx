"use client";

import { useState } from "react";
import type { CrownState } from "@/lib/crowns-data";
import { formatMoney } from "@/lib/format";
import { CrownKingdomGrid } from "@/components/crowns/CrownKingdomGrid";
import { CrownAuctionTable } from "@/components/crowns/CrownAuctionTable";

type View = "kingdom" | "auction";

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
    <div className="space-y-6">
      {/* Live stats — rankbid.tattoo style */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]">
        <span className="font-semibold tabular text-foreground">{formatMoney(totalRaised)} raised</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted sm:inline-block" aria-hidden />
        <span className="text-muted">
          <span className="font-semibold text-foreground">{totalWatching || totalBids}</span>{" "}
          {totalWatching > 0 ? "watching" : "bids placed"}
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-muted sm:inline-block" aria-hidden />
        <span className="flex items-center gap-1.5 text-muted">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-green" />
          <span>
            <span className="font-semibold text-[var(--crown-gold)]">{claimed}</span> of {crowns.length} crowns claimed
          </span>
        </span>
      </div>

      {/* Headline + view toggle — brandmymac style */}
      <div className="flex flex-col items-center gap-5 text-center">
        <div>
          <h3 className="font-display text-[28px] font-semibold leading-tight sm:text-[36px]">
            Put your brand on{" "}
            <span className="relative inline-block">
              <span className="relative z-10">the crown.</span>
              <span className="crown-headline-mark absolute -inset-x-1 bottom-0 top-[55%] -skew-y-1 rounded-sm" aria-hidden />
            </span>
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">
            Every jewel is a live throne. Highest bid wins until someone steals it.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setView("kingdom")}
            className={`rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-wide transition-all ${
              view === "kingdom"
                ? "bg-[var(--crown-gold)] text-[#0a0908] shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            👑 Kingdom map
          </button>
          <button
            type="button"
            onClick={() => setView("auction")}
            className={`rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-wide transition-all ${
              view === "auction"
                ? "bg-[var(--crown-gold)] text-[#0a0908] shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            The auction, live
          </button>
        </div>
      </div>

      {/* Live bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green" />
          <span className="text-[13px] font-medium">Live auction</span>
          <span className="text-[12px] text-muted">· ongoing, no deadline</span>
        </div>
        <p className="text-[13px] text-muted">
          {view === "kingdom" ? "Tap any spot to bid" : "Outbid any crown anytime"}
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
