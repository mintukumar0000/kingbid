"use client";

import type { CrownState } from "@/lib/crowns-data";
import { CrownCardFeatured, CrownCardRow } from "@/components/crowns/CrownCard";

export function LiveCrownsArena({
  crowns,
  onSteal,
}: {
  crowns: CrownState[];
  onSteal: (c: CrownState) => void;
}) {
  if (!crowns.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted">
        Loading crowns…
      </div>
    );
  }

  const featured = crowns.slice(0, 3);
  const rest = crowns.slice(3);
  const claimed = crowns.filter((c) => c.hasKing).length;

  return (
    <div className="space-y-6">
      {/* Live auction bar — Brand My Mac style */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green" />
          <span className="text-[13px] font-medium text-foreground">Live auction</span>
        </div>
        <p className="text-[13px] text-muted">
          <span className="font-semibold text-[var(--crown-gold)]">{claimed}</span> of {crowns.length} crowns claimed
        </p>
      </div>

      {/* Podium — top 3 featured */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CrownCardFeatured crown={featured[0]!} onSteal={onSteal} rank={1} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {featured[1] && <CrownCardFeatured crown={featured[1]} onSteal={onSteal} rank={2} />}
          {featured[2] && <CrownCardFeatured crown={featured[2]} onSteal={onSteal} rank={3} />}
        </div>
      </div>

      {/* Remaining crowns — visual list */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">All crowns</p>
          {rest.map((crown, i) => (
            <CrownCardRow key={crown.slug} crown={crown} onSteal={onSteal} index={i + 3} />
          ))}
        </div>
      )}
    </div>
  );
}
