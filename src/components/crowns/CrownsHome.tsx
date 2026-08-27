"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { CrownCard } from "@/components/crowns/CrownCard";
import { LiveCrownsArena } from "@/components/crowns/LiveCrownsArena";
import { BidModal, type BidPrefill } from "@/components/BidModal";
import { getCrown, crownBidParams, CROWN_DISCLAIMER, type CrownGroup } from "@/lib/crowns";
import type { CrownState, DethronementFeedItem } from "@/lib/crowns-data";
import type { LeaderboardData } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";
import { PAGE_WIDE } from "@/lib/layout";
import { RelativeTime } from "@/components/RelativeTime";

type Filter = "all" | "trending" | CrownGroup;

type Payload = {
  crowns: CrownState[];
  trending: CrownState[];
  mostWanted: CrownState[];
  dethronements: DethronementFeedItem[];
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "trending", label: "🔥 TRENDING" },
  { id: "tech", label: "TECH" },
  { id: "places", label: "🌎 PLACES" },
  { id: "internet", label: "🌐 INTERNET" },
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
  const [categorySlug, setCategorySlug] = useState<string | undefined>();

  const apiFilter = filter === "all" ? "" : `?filter=${filter}`;
  const { data } = useSWR<Payload>(`/api/crowns${apiFilter}`, fetcher, { refreshInterval: 12_000 });

  const placeCrowns = useMemo(() => data?.crowns.filter((c) => c.group === "places") ?? [], [data]);

  async function openSteal(crown: CrownState) {
    const def = getCrown(crown.slug);
    if (!def) return;
    const params = crownBidParams(def);
    setBoardScope(params.scope);
    setCountryCode(params.countryCode);
    setCategorySlug(params.categorySlug);

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
      <section className={`${PAGE_WIDE} pb-6 pt-10 text-center sm:pt-14`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--crown-gold)]">👑 KingBid</p>
        <h1 className="font-display mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[52px]">
          WHO&apos;S KING? 👑
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Bid for the crown.
          <br />
          Keep it until someone outbids you.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
            className="rounded-full bg-[var(--crown-gold)] px-7 py-3 text-[14px] font-bold uppercase tracking-wide text-[#0a0908] hover:brightness-110"
          >
            Claim a Crown
          </button>
          <a
            href="#live-crowns"
            className="rounded-full border border-border-strong px-7 py-3 text-[14px] font-semibold text-foreground hover:border-[var(--crown-gold)] hover:text-[var(--crown-gold)]"
          >
            Explore Crowns
          </a>
        </div>
      </section>

      {/* Live Crowns */}
      <section id="live-crowns" className={`${PAGE_WIDE} pb-12`}>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display text-[26px] font-semibold sm:text-[30px]">🔥 Live Crowns</h2>
            <p className="mt-1 text-[14px] text-muted">Every spot shows its current top bid.</p>
          </div>
          <nav className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                  filter === f.id
                    ? "bg-[var(--crown-gold)] text-[#0a0908] shadow-[0_0_20px_rgba(201,162,39,0.25)]"
                    : "border border-border/80 bg-surface/50 text-muted hover:border-[var(--crown-gold)]/40 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          <LiveCrownsArena crowns={crowns} onSteal={openSteal} />
        </div>
      </section>

      {/* Trending */}
      {data?.trending && data.trending.length > 0 && filter === "all" && (
        <section className={`${PAGE_WIDE} border-t border-border pb-12 pt-10`}>
          <h2 className="font-display text-[22px] font-semibold">🔥 Trending</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.trending.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`/crown/${c.slug}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-[var(--crown-gold)]/40"
              >
                <span className="font-semibold">👑 {c.name}</span>
                <span className="text-[13px] font-bold text-[var(--crown-gold)]">
                  +{formatMoney(c.bidDeltaToday)} today
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Most Wanted */}
      {data?.mostWanted && data.mostWanted.length > 0 && filter === "all" && (
        <section className={`${PAGE_WIDE} border-t border-border pb-12 pt-10`}>
          <h2 className="font-display text-[22px] font-semibold">🎯 Most Wanted</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.mostWanted.map((c) => (
              <CrownCard key={c.slug} crown={c} onSteal={openSteal} compact />
            ))}
          </div>
        </section>
      )}

      {/* Kingdom */}
      {filter === "all" && placeCrowns.length > 0 && (
        <section id="kingdom" className={`${PAGE_WIDE} border-t border-border pb-12 pt-10`}>
          <h2 className="font-display text-[22px] font-semibold">🌎 The Kingdom</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{CROWN_DISCLAIMER}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {placeCrowns.map((c) => (
              <Link
                key={c.slug}
                href={`/crown/${c.slug}`}
                className="rounded-xl border border-border bg-surface-2 px-4 py-5 text-center transition-all hover:border-[var(--crown-gold)]/50 hover:bg-surface"
              >
                <span className="text-2xl">{c.flag}</span>
                <p className="mt-2 font-semibold">{c.name}</p>
                <p className="mt-1 text-[12px] text-muted">
                  {c.hasKing ? `${c.kingHandle} · ${formatMoney(c.currentBid)}` : "Unclaimed"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently dethroned */}
      {data?.dethronements && data.dethronements.length > 0 && filter === "all" && (
        <section className={`${PAGE_WIDE} border-t border-border pb-16 pt-10`}>
          <h2 className="font-display text-[22px] font-semibold">🏆 Recently Dethroned</h2>
          <ul className="mt-4 space-y-3">
            {data.dethronements.map((d, i) => (
              <li
                key={`${d.at}-${i}`}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-[14px]"
              >
                <Link href={`/crown/${d.crownSlug}`} className="font-semibold text-[var(--crown-gold)] hover:underline">
                  {d.crownName}
                </Link>
                <span className="text-muted">
                  {d.previousKing} → {d.newKing}
                </span>
                <span className="tabular text-muted">
                  {formatMoney(d.previousBid)} → {formatMoney(d.newBid)}
                </span>
                <span className="ml-auto text-[12px] text-muted">
                  <RelativeTime date={d.at} />
                </span>
              </li>
            ))}
          </ul>
        </section>
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
