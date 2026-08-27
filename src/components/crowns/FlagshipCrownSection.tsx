"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { TIER_SUMMARY } from "@/lib/crown-spots";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { CrownSpotPanel } from "@/components/crowns/CrownSpotPanel";
import type { LeaderboardData } from "@/lib/leaderboard";
import type { BidPrefill } from "@/components/BidModal";

const CrownArena3D = dynamic(
  () => import("@/components/crowns/CrownArena3D").then((m) => m.CrownArena3D),
  {
    ssr: false,
    loading: () => (
      <div className="crown-arena-canvas-wrap crown-arena-loading">
        <div className="crown-arena-loading-inner">Loading crown…</div>
      </div>
    ),
  }
);

type SpotsPayload = {
  spots: CrownSpotState[];
  stats: { totalValue: number; claimed: number; total: number };
};

interface Props {
  onOpenBid: (spot: CrownSpotState, board: LeaderboardData, prefill: BidPrefill) => void;
}

export function FlagshipCrownSection({ onOpenBid }: Props) {
  const { data } = useSWR<SpotsPayload>("/api/crown-spots", fetcher, { refreshInterval: 8_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const spots = data?.spots ?? [];
  const stats = data?.stats ?? { totalValue: 0, claimed: 0, total: 21 };
  const crownOwner = useMemo(() => spots.find((s) => s.tier === "crown"), [spots]);
  const selected = spots.find((s) => s.id === selectedId) ?? null;

  async function openBid(spot: CrownSpotState) {
    const qs = new URLSearchParams({
      page: "1",
      limit: "50",
      scope: "global",
      category: spot.categorySlug,
    });
    const res = await fetch(`/api/listings?${qs}`);
    const board = (await res.json()) as LeaderboardData;
    onOpenBid(spot, board, {
      mode: "new",
      amount: spot.nextBid,
      amountIsTargetTotal: true,
      targetTitle: spot.label,
    });
  }

  return (
    <section id="explore-crown" className="flagship-crown-section">
      <div className="flagship-crown-intro">
        <p className="kb-eyebrow">21 ownable spots</p>
        <p className="flagship-crown-sub">
          1 Crown · 4 Diamonds · 8 Royal · 8 Court
        </p>
        {stats.totalValue > 0 && (
          <p className="flagship-crown-value tabular">
            Currently worth {formatMoney(stats.totalValue)}
          </p>
        )}
      </div>

      <div className="flagship-crown-stage">
        <CrownArena3D spots={spots} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && (
          <CrownSpotPanel
            spot={selected}
            onBid={() => openBid(selected)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {crownOwner && (
        <div className="flagship-crown-live">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green" aria-hidden />
          <span>Live auction</span>
          <span className="flagship-crown-live-sep">·</span>
          <strong>Crown Owner</strong>
          <span className="tabular">
            {crownOwner.hasOwner
              ? `@${crownOwner.ownerHandle} · ${formatMoney(crownOwner.currentBid)}`
              : `Open · from ${formatMoney(crownOwner.startingBid)}`}
          </span>
          <button type="button" className="flagship-crown-live-cta" onClick={() => openBid(crownOwner)}>
            Claim the crown →
          </button>
        </div>
      )}

      <div className="flagship-tier-grid">
        {TIER_SUMMARY.map((t) => (
          <div key={t.tier} className="flagship-tier-pill">
            <span>{t.label}</span>
            <span className="text-muted">{t.count} · {t.range}</span>
          </div>
        ))}
      </div>

      <p className="flagship-crown-tagline">Own your piece of the internet.</p>
    </section>
  );
}
