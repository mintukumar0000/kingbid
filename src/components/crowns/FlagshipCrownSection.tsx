"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { liveStat } from "@/lib/copy";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import { CrownSpotPanel } from "@/components/crowns/CrownSpotPanel";
import type { LeaderboardData } from "@/lib/leaderboard";
import type { BidPrefill } from "@/components/BidModal";
import type { PlatformStats } from "@/components/StatsBar";

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
  const { data: platform } = useSWR<PlatformStats>("/api/stats", fetcher, { refreshInterval: 8_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const spots = data?.spots ?? [];
  const stats = data?.stats ?? { totalValue: 0, claimed: 0, total: 21 };
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
      <div className="flagship-crown-stats">
        <span className="flagship-stat flagship-stat--green tabular">
          {formatMoney(stats.totalValue || platform?.totalRevenue || 0)} on the crown
        </span>
        <span className="flagship-stat-sep">·</span>
        <span className="flagship-stat tabular">{liveStat(platform?.online)} watching</span>
        <span className="flagship-stat-sep">·</span>
        <span className="flagship-stat tabular">{liveStat(platform?.totalVisitors)} visitors</span>
        <span className="flagship-stat-sep">·</span>
        <Link href="/stats" className="flagship-stat flagship-stat--link">
          Full stats →
        </Link>
      </div>

      <h1 className="flagship-crown-headline">
        Put your logo on{" "}
        <span className="flagship-crown-headline-accent">the crown.</span>
      </h1>
      <p className="flagship-crown-deck">
        <span className="tabular">{stats.claimed}</span> of {stats.total} spots claimed · ongoing, no deadline
      </p>

      <div className="flagship-crown-stage">
        <CrownArena3D spots={spots} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && (
          <>
            <button
              type="button"
              className="crown-spot-backdrop"
              aria-label="Close spot panel"
              onClick={() => setSelectedId(null)}
            />
            <div className="crown-spot-panel-wrap">
              <CrownSpotPanel
                spot={selected}
                onBid={() => openBid(selected)}
                onClose={() => setSelectedId(null)}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
