"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/leaderboard";
import { fetcher } from "@/lib/fetcher";
import { formatMoney, formatMoneyPlain } from "@/lib/format";
import { estimateRankForNewBid } from "@/lib/pricing";
import { BidModal, type BidPrefill } from "@/components/BidModal";
import { ListingRow } from "@/components/ListingRow";
import { TrendingSection } from "@/components/TrendingSection";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { StatsBar } from "@/components/StatsBar";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { LiveRevenueTicker } from "@/components/LiveRevenueTicker";
import { ReferralTracker } from "@/components/ReferralTracker";
import { ScopeToggle } from "@/components/ScopeToggle";
import { CategoryBoardTabs } from "@/components/CategoryBoardTabs";
import { CountryPicker } from "@/components/CountryPicker";
import { PAGE } from "@/lib/layout";
import type { BoardScope } from "@/lib/geo";
import { countryDisplayName } from "@/lib/geo";
import { COUNTRY_COOKIE } from "@/lib/brand";
import { emptyBoardMessage, heroSubtext } from "@/lib/copy";

const PAGE_SIZE = 50;

function TierDivider({ label }: { label: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full bg-accent-soft px-3 py-0.5 text-[11px] font-semibold tracking-wide text-accent">
          {label}
        </span>
      </div>
    </div>
  );
}

function pageButtons(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function HomeClient({
  initialData,
  viewerCountry,
}: {
  initialData: LeaderboardData;
  viewerCountry: string;
}) {
  return (
    <Suspense fallback={null}>
      <ReferralTracker />
      <HomeClientInner initialData={initialData} viewerCountry={viewerCountry} />
    </Suspense>
  );
}

function HomeClientInner({
  initialData,
  viewerCountry,
}: {
  initialData: LeaderboardData;
  viewerCountry: string;
}) {
  useLiveUpdates();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<BoardScope>("global");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(viewerCountry);
  const countryName = countryDisplayName(selectedCountry);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`${COUNTRY_COOKIE}=([A-Za-z]{2})`));
    if (match) setSelectedCountry(match[1].toUpperCase());
  }, []);

  const [page, setPage] = useState(1);
  const listingsUrl = categorySlug
    ? `/api/listings?page=${page}&limit=${PAGE_SIZE}&category=${encodeURIComponent(categorySlug)}`
    : scope === "local"
      ? `/api/listings?page=${page}&limit=${PAGE_SIZE}&scope=local&country=${encodeURIComponent(selectedCountry)}`
      : `/api/listings?page=${page}&limit=${PAGE_SIZE}&scope=global`;

  const { data, mutate } = useSWR<LeaderboardData>(
    listingsUrl,
    fetcher,
    { refreshInterval: 12_000, fallbackData: page === 1 && scope === "global" ? initialData : undefined }
  );

  const board = data ?? (scope === "global" && page === 1 ? initialData : {
    ...initialData,
    entries: [],
    total: 0,
    bidSnapshot: [],
    topBid: 0,
    claimTopPrice: initialData.minBid,
    takeoverPrice: 0,
    scope,
    countryCode: scope === "local" ? selectedCountry : null,
    countryName: scope === "local" ? countryName : null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<BidPrefill>({ mode: "new", amount: board.minBid });
  const [heroAmount, setHeroAmount] = useState<number | null>(null);
  const [heroUrl, setHeroUrl] = useState("");
  const heroValue = heroAmount ?? board.claimTopPrice;

  // One-click re-bid from kingbid email (?rebid=slug&amount=X) or listing page (?claim=slug)
  useEffect(() => {
    const rebid = searchParams.get("rebid") ?? searchParams.get("claim");
    const amount = searchParams.get("amount");
    if (!rebid) return;
    setHeroUrl(rebid);
    const parsed = amount ? parseInt(amount, 10) : board.claimTopPrice;
    if (!Number.isNaN(parsed)) {
      setHeroAmount(parsed);
      setPrefill({ mode: "new", amount: parsed, url: rebid });
      setModalOpen(true);
    }
  }, [searchParams, board.claimTopPrice]);
  const heroRank = useMemo(
    () => estimateRankForNewBid(heroValue, board.bidSnapshot),
    [heroValue, board.bidSnapshot]
  );

  const totalPages = Math.max(1, Math.ceil(board.total / PAGE_SIZE));
  const pages = useMemo(() => pageButtons(page, totalPages), [page, totalPages]);

  function openClaim(entry: LeaderboardEntry) {
    setPrefill({
      mode: "claim",
      amount: entry.claimPrice,
      targetRank: entry.rank,
      targetTitle: entry.title,
    });
    setModalOpen(true);
  }

  function openHeroBid() {
    setPrefill({
      mode: "new",
      amount: heroValue,
      url: heroUrl.trim() || undefined,
    });
    setModalOpen(true);
  }

  const featured = page === 1 ? board.entries.filter((e) => e.rank <= 3) : [];
  const rest = page === 1 ? board.entries.filter((e) => e.rank > 3) : board.entries;

  function insertDivider(rank: number) {
    if (page !== 1) return null;
    if (rank === 4) return <TierDivider label="TOP 3" />;
    if (rank === 11) return <TierDivider label="TOP 10" />;
    if (rank === 21) return <TierDivider label="TOP 20" />;
    return null;
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 pt-5 pb-1">
        <StatsBar />
        <ScopeToggle
          scope={scope}
          countryCode={selectedCountry}
          countryName={countryName}
          onChange={(next) => {
            setScope(next);
            setPage(1);
            setHeroAmount(null);
            setCategorySlug(null);
          }}
        />
        <CategoryBoardTabs
          scope={scope}
          categorySlug={categorySlug}
          onScopeChange={(next) => {
            setScope(next);
            setPage(1);
            setHeroAmount(null);
          }}
          onCategoryChange={(slug) => {
            setCategorySlug(slug);
            setPage(1);
            setHeroAmount(null);
          }}
        />
        {scope === "local" && (
          <CountryPicker
            value={selectedCountry}
            detectedCountry={viewerCountry}
            onChange={(code) => {
              setSelectedCountry(code);
              setPage(1);
              setHeroAmount(null);
            }}
          />
        )}
      </div>

      <section className={`${PAGE} pt-6 pb-8 text-center`}>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground sm:text-[36px]">
          {scope === "local" ? (
            <>Claim #{heroRank} in {countryName} for</>
          ) : board.categoryName ? (
            <>Claim #{heroRank} on {board.categoryName} for</>
          ) : (
            <>Claim #{heroRank} for</>
          )}
          <span className="mx-2 inline-flex items-baseline gap-2 align-middle sm:mx-3">
            <button
              type="button"
              onClick={() => setHeroAmount(Math.max(board.minBid, heroValue - 1))}
              className="text-[28px] leading-none text-muted hover:text-foreground sm:text-[32px]"
              aria-label="Decrease amount"
            >
              −
            </button>
            <span className="tabular text-[28px] text-accent underline decoration-accent/50 underline-offset-[6px] sm:text-[36px]">
              {formatMoneyPlain(heroValue)}
            </span>
            <button
              type="button"
              onClick={() => setHeroAmount(Math.min(999_999, heroValue + 1))}
              className="text-[28px] leading-none text-muted hover:text-foreground sm:text-[32px]"
              aria-label="Increase amount"
            >
              +
            </button>
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-accent">
          {heroSubtext(
            board.minBid,
            scope,
            scope === "local" ? countryName : board.categoryName ?? undefined
          )}
        </p>

        <form
          className="mx-auto mt-6 flex max-w-2xl items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-[var(--shadow)]"
          onSubmit={(e) => {
            e.preventDefault();
            openHeroBid();
          }}
        >
          <span className="pl-3.5 text-muted" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
            </svg>
          </span>
          <input
            value={heroUrl}
            onChange={(e) => setHeroUrl(e.target.value)}
            placeholder="Your product URL or @handle"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[14px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Kingbid
          </button>
        </form>

        <p className="mt-3 text-[12.5px] text-muted">
          Already on the list? Enter the same URL or @handle and up your bid.
        </p>
      </section>

      <section className={`${PAGE} grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2`}>
        <TrendingSection scope={scope} countryCode={scope === "local" ? selectedCountry : null} />
        <LiveActivityFeed limit={5} />
      </section>

      <section className={`${PAGE} pb-6`}>
        {featured.length > 0 && (
          <div className="pt-3">
            {featured.map((entry) => (
              <ListingRow key={entry.id} entry={entry} onClaim={openClaim} featured scope={scope} />
            ))}
          </div>
        )}

        {rest.map((entry) => (
          <div key={entry.id}>
            {insertDivider(entry.rank)}
            <ListingRow entry={entry} onClaim={openClaim} featured={false} scope={scope} />
          </div>
        ))}

        {board.entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">
            <p className="text-[15px] font-medium text-foreground">
              {emptyBoardMessage(
                board.minBid,
                scope,
                scope === "local" ? countryName : board.categoryName ?? undefined
              )}
            </p>
            <p className="mt-2 text-[13px]">Every listing here opted in with a real payment.</p>
          </div>
        )}

        {board.total > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-md px-1">
            {totalPages > 1 && (
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center text-accent disabled:opacity-30 hover:opacity-80"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {pages.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1.5 text-accent">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`tabular flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-medium transition-colors ${
                        p === page
                          ? "bg-accent text-white"
                          : "text-accent hover:bg-accent-soft"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center text-accent disabled:opacity-30 hover:opacity-80"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
            )}
            <button
              type="button"
              onClick={() => mutate()}
              className="absolute right-0 top-0 hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground shadow-sm hover:border-accent sm:inline-flex"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="flex w-full max-w-md items-center justify-between px-1 sm:justify-center">
            <p className="tabular text-[12.5px] text-muted">
              {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, board.total)} of{" "}
              {board.total.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground shadow-sm hover:border-accent sm:hidden"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        )}

      </section>

      <LiveRevenueTicker />

      <BidModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefill={prefill}
        board={board}
        scope={scope}
        countryName={countryName}
        countryCode={selectedCountry}
      />
    </>
  );
}
