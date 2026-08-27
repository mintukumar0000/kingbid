"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { LiveCrownsArena } from "@/components/crowns/LiveCrownsArena";
import { FlagshipCrownSection } from "@/components/crowns/FlagshipCrownSection";
import {
  CrownsTrending,
  CrownsMostWanted,
  CrownsKingdomMap,
  CrownsDethronedFeed,
} from "@/components/crowns/CrownsFeedSections";
import { BidModal, type BidPrefill } from "@/components/BidModal";
import { getCrown, crownBidParams, type CrownGroup } from "@/lib/crowns";
import type { CrownState, DethronementFeedItem } from "@/lib/crowns-data";
import type { CrownSpotState } from "@/lib/crown-spots-data";
import type { LeaderboardData } from "@/lib/leaderboard";
import { PAGE_WIDE } from "@/lib/layout";

type Filter = "all" | "trending" | CrownGroup;

type Payload = {
  crowns: CrownState[];
  trending: CrownState[];
  mostWanted: CrownState[];
  dethronements: DethronementFeedItem[];
};

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
  const { data } = useSWR<Payload>(`/api/crowns${apiFilter}`, fetcher, { refreshInterval: 8_000 });

  const placeCrowns = useMemo(() => data?.crowns.filter((c) => c.group === "places") ?? [], [data]);

  function openBoardBid(boardData: LeaderboardData, bidPrefill: BidPrefill) {
    setBoardScope("global");
    setCountryCode(undefined);
    setBoard(boardData);
    setPrefill(bidPrefill);
    setModalOpen(true);
  }

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
    openBoardBid(boardData, {
      mode: "new",
      amount: crown.nextBid,
      amountIsTargetTotal: true,
    });
  }

  function openSpotBid(spot: CrownSpotState, boardData: LeaderboardData, bidPrefill: BidPrefill) {
    openBoardBid(boardData, bidPrefill);
  }

  const crowns = data?.crowns ?? [];

  return (
    <>
      <section className={`crowns-hero ${PAGE_WIDE} pb-6 pt-12 text-center sm:pt-16`}>
        <div className="crowns-hero-glow" aria-hidden />
        <p className="kb-eyebrow relative">KingBid</p>
        <h1 className="relative mt-3 text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">
          Who&apos;s <span className="arena-headline-accent">king</span>?
        </h1>
        <p className="relative mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-muted">
          21 spots. One crown.
          <br />
          Bid for your place. Keep it until someone takes it.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#explore-crown" className="crowns-cta-primary">
            Explore the crown
          </a>
          <a href="#crowns-to-claim" className="crowns-cta-secondary">
            Crowns to claim
          </a>
        </div>
      </section>

      <div className={PAGE_WIDE}>
        <FlagshipCrownSection onOpenBid={openSpotBid} />
      </div>

      <section id="crowns-to-claim" className={`${PAGE_WIDE} pb-12 pt-4`}>
        <div className="crowns-section-heading">
          <h2>Crowns to claim</h2>
          <p>Category kingdoms · separate live auctions</p>
        </div>
        <LiveCrownsArena crowns={crowns} onSteal={openSteal} filter={filter} onFilterChange={setFilter} />
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
