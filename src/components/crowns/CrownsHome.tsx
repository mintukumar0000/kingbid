"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { LiveCrownsArena } from "@/components/crowns/LiveCrownsArena";
import {
  CrownsTrending,
  CrownsMostWanted,
  CrownsKingdomMap,
  CrownsDethronedFeed,
} from "@/components/crowns/CrownsFeedSections";
import { BidModal, type BidPrefill } from "@/components/BidModal";
import { getCrown, crownBidParams, type CrownGroup } from "@/lib/crowns";
import type { CrownState, DethronementFeedItem } from "@/lib/crowns-data";
import type { LeaderboardData } from "@/lib/leaderboard";
import { PAGE_WIDE } from "@/lib/layout";

type Filter = "all" | "trending" | CrownGroup;

type Payload = {
  crowns: CrownState[];
  trending: CrownState[];
  mostWanted: CrownState[];
  dethronements: DethronementFeedItem[];
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "tech", label: "Tech" },
  { id: "places", label: "Places" },
  { id: "internet", label: "Internet" },
];

const EMPTY_BOARD: LeaderboardData = {
  entries: [],
  bidSnapshot: [],
  total: 0,
  page: 1,
  pageSize: 50,
  topBid: 0,
  claimTopPrice: 5,
  takeoverPrice: 0,
  takeoverActiveUntil: null,
  minBid: 5,
  scope: "global",
  countryCode: null,
  countryName: null,
};

export function CrownsHome() {
  useLiveUpdates();
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<BidPrefill>({ mode: "new", amount: 5 });
  const [board, setBoard] = useState<LeaderboardData>(EMPTY_BOARD);
  const [boardScope, setBoardScope] = useState<"global" | "local">("global");
  const [countryCode, setCountryCode] = useState<string | undefined>();

  const apiFilter = filter === "all" ? "" : `?filter=${filter}`;
  const { data } = useSWR<Payload>(`/api/crowns${apiFilter}`, fetcher, { refreshInterval: 12_000 });

  const placeCrowns = useMemo(() => data?.crowns.filter((c) => c.group === "places") ?? [], [data]);

  async function openSteal(crown: CrownState) {
    const def = getCrown(crown.slug);
    if (!def) return;
    const params = crownBidParams(def);
    setBoardScope(params.scope);
    setCountryCode(params.countryCode);

    const qs = new URLSearchParams({ page: "1", limit: "50", scope: params.scope });
    if (params.countryCode) qs.set("country", params.countryCode);
    if (params.categorySlug) qs.set("category", params.categorySlug);

    const res = await fetch(`/api/listings?${qs}`);
    const boardData = (await res.json()) as LeaderboardData;
    setBoard(boardData);
    setPrefill({
      mode: "new",
      amount: crown.nextBid,
      amountIsTargetTotal: true,
    });
    setModalOpen(true);
  }

  const crowns = data?.crowns ?? [];

  return (
    <>
      {/* Hero */}
      <section className={`crowns-hero ${PAGE_WIDE} pb-6 pt-10 text-center sm:pt-14`}>
        <div className="crowns-hero-glow" aria-hidden />
        <p className="kb-eyebrow relative">KingBid</p>
        <h1 className="font-display relative mt-4 text-[42px] font-semibold leading-[1.02] tracking-tight sm:text-[58px]">
          <span className="arena-headline-glow">WHO&apos;S KING?</span>
          <span className="ml-2 inline-block animate-[crown-float_3s_ease-in-out_infinite]" aria-hidden>
            👑
          </span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Bid for the crown. Keep it until someone outbids you.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              const first = crowns[0];
              if (first) openSteal(first);
              else {
                setBoard(EMPTY_BOARD);
                setPrefill({ mode: "new", amount: 5, amountIsTargetTotal: true });
                setModalOpen(true);
              }
            }}
            className="crowns-cta-primary"
          >
            Claim a Crown
          </button>
          <a href="#live-crowns" className="crowns-cta-secondary">
            Explore Crowns
          </a>
        </div>
      </section>

      {/* Live Crowns */}
      <section id="live-crowns" className={`${PAGE_WIDE} pb-12`}>
        <nav className="crowns-filter-nav mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`crowns-filter-btn ${filter === f.id ? "crowns-filter-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </nav>

        <LiveCrownsArena crowns={crowns} onSteal={openSteal} filter={filter} />
      </section>

      {filter === "all" && (
        <div className={`${PAGE_WIDE} crowns-feed`}>
          {data?.trending && <CrownsTrending crowns={data.trending} onClaim={openSteal} />}
          {data?.mostWanted && <CrownsMostWanted crowns={data.mostWanted} onClaim={openSteal} />}
          {placeCrowns.length > 0 && <CrownsKingdomMap crowns={placeCrowns} onClaim={openSteal} />}
          {data?.dethronements && <CrownsDethronedFeed items={data.dethronements} />}
        </div>
      )}

      <BidModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefill={prefill}
        board={board}
        scope={boardScope}
        countryCode={countryCode}
      />
    </>
  );
}
