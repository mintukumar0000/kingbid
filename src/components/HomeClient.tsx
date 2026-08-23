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
import { StatsBar } from "@/components/StatsBar";
import { useLiveUpdates } from "@/hooks/useLiveUpdates";
import { LiveRevenueTicker } from "@/components/LiveRevenueTicker";
import { ReferralTracker } from "@/components/ReferralTracker";
import { ScopeToggle } from "@/components/ScopeToggle";
import { CategoryRoom, CategoryEmptyState } from "@/components/CategoryRoom";
import { HomeEcosystem } from "@/components/HomeEcosystem";
import { HowItWorksStrip } from "@/components/HowItWorksStrip";
import { CountryPicker } from "@/components/CountryPicker";
import { PAGE } from "@/lib/layout";
import type { BoardScope } from "@/lib/geo";
import { countryDisplayName } from "@/lib/geo";
import { COUNTRY_COOKIE } from "@/lib/brand";
import { emptyBoardMessage, heroSubtext, HERO_BRAND, HERO_TAGLINE } from "@/lib/copy";

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

  useEffect(() => {
    const room = searchParams.get("room");
    if (room) setCategorySlug(room);
  }, [searchParams]);

  const { data: categoriesData } = useSWR<{
    categories: { slug: string; boardId: string | null; listingCount: number }[];
  }>("/api/categories", fetcher);
  const activeCategory = categoriesData?.categories.find((c) => c.slug === categorySlug);
  const inCategoryRoom = !!categorySlug;

  const [page, setPage] = useState(1);
  const listingsUrl = categorySlug
    ? `/api/listings?page=${page}&limit=${PAGE_SIZE}&category=${encodeURIComponent(categorySlug)}`
    : scope === "local"
      ? `/api/listings?page=${page}&limit=${PAGE_SIZE}&scope=local&country=${encodeURIComponent(selectedCountry)}`
      : `/api/listings?page=${page}&limit=${PAGE_SIZE}&scope=global`;

  const { data, mutate } = useSWR<LeaderboardData>(listingsUrl, fetcher, {
    refreshInterval: 12_000,
    fallbackData: page === 1 && scope === "global" && !categorySlug ? initialData : undefined,
  });

  const board =
    data ??
    (scope === "global" && page === 1 && !categorySlug
      ? initialData
      : {
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

  function enterRoom(slug: string) {
    setCategorySlug(slug);
    setScope("global");
    setPage(1);
    setHeroAmount(null);
    window.history.replaceState(null, "", `/?room=${encodeURIComponent(slug)}`);
  }

  function exitRoom() {
    setCategorySlug(null);
    setPage(1);
    setHeroAmount(null);
    window.history.replaceState(null, "", "/");
  }

  const featured = page === 1 ? board.entries.filter((e) => e.rank <= 3) : [];
  const rest = page === 1 ? board.entries.filter((e) => e.rank > 3) : board.entries;

  function insertDivider(rank: number) {
    if (page !== 1) return null;
    if (rank === 4) return <TierDivider label={inCategoryRoom ? "THE PODIUM" : "TOP 3"} />;
    if (rank === 11) return <TierDivider label="TOP 10" />;
    if (rank === 21) return <TierDivider label="TOP 20" />;
    return null;
  }

  function renderHero(variant: "home" | "room") {
    const claimLine =
      scope === "local" ? (
        <>Claim #{heroRank} in {countryName} for</>
      ) : variant === "room" && board.categoryName ? (
        <>Claim #{heroRank} in {board.categoryName} for</>
      ) : (
        <>Claim #{heroRank} for</>
      );

    return (
      <>
        {variant === "home" ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent/80">{HERO_BRAND}</p>
            <h1 className="mt-2 text-[32px] font-bold tracking-tight text-foreground sm:text-[42px]">{HERO_TAGLINE}</h1>
            <HowItWorksStrip />
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent/80">{HERO_BRAND}</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight text-foreground sm:text-[34px]">
              {board.categoryName ?? "Room"}
            </h1>
          </>
        )}

        <div className={`mx-auto max-w-xl ${variant === "home" ? "mt-8" : "mt-6"}`}>
          <p className="text-[14px] font-medium text-foreground/90">
            {claimLine}
            <span className="mx-2 inline-flex items-baseline gap-2 align-middle">
              <button
                type="button"
                onClick={() => setHeroAmount(Math.max(board.minBid, heroValue - 1))}
                className="text-[20px] leading-none text-muted hover:text-foreground"
                aria-label="Decrease amount"
              >
                −
              </button>
              <span className="tabular text-[22px] font-bold text-accent underline decoration-accent/50 underline-offset-[6px] sm:text-[26px]">
                {formatMoneyPlain(heroValue)}
              </span>
              <button
                type="button"
                onClick={() => setHeroAmount(Math.min(999_999, heroValue + 1))}
                className="text-[20px] leading-none text-muted hover:text-foreground"
                aria-label="Increase amount"
              >
                +
              </button>
            </span>
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            {heroSubtext(
              board.minBid,
              scope,
              scope === "local" ? countryName : board.categoryName ?? undefined
            )}
          </p>
        </div>

        <form
          className="mx-auto mt-5 flex max-w-2xl items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-[var(--shadow)]"
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
            className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Kingbid
          </button>
        </form>

        <p className="mt-3 text-[12.5px] text-muted">
          {variant === "room"
            ? "Have a claim invite? Submit the same URL after opening your link."
            : "Already on the list? Enter the same URL or @handle and up your bid."}
        </p>
      </>
    );
  }

  const listingsBlock = (
    <>
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

      {board.entries.length === 0 &&
        (inCategoryRoom && categorySlug ? (
          <CategoryEmptyState slug={categorySlug} minBid={board.minBid} onClaim={openHeroBid} />
        ) : (
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
        ))}

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
                          p === page ? "bg-accent text-white" : "text-accent hover:bg-accent-soft"
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
    </>
  );

  const topLeader = board.entries.find((e) => e.rank === 1) ?? board.entries[0] ?? null;

  return (
    <>
      <div className="flex flex-col items-center gap-4 pt-5 pb-1">
        <StatsBar />
        {!inCategoryRoom && (
          <ScopeToggle
            scope={scope}
            countryCode={selectedCountry}
            countryName={countryName}
            onChange={(next) => {
              setScope(next);
              setPage(1);
              setHeroAmount(null);
            }}
          />
        )}
        {scope === "local" && !inCategoryRoom && (
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

      {inCategoryRoom && categorySlug ? (
        <CategoryRoom
          slug={categorySlug}
          boardId={activeCategory?.boardId ?? null}
          listingCount={board.total}
          topBid={board.topBid}
          foundingPrice={board.minBid}
          onExit={exitRoom}
          topLeader={topLeader}
        >
          <div className="text-center">{renderHero("room")}</div>
          <div className="mt-8">{listingsBlock}</div>
        </CategoryRoom>
      ) : (
        <>
          <section className={`${PAGE} pt-6 pb-4 text-center`}>{renderHero("home")}</section>

          {scope === "global" && <HomeEcosystem onEnterRoom={enterRoom} />}

          <section className={`${PAGE} pb-6`}>
            <div className="mb-4 flex items-end justify-between gap-2 border-t border-border pt-8">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-foreground sm:text-[17px]">
                  Full leaderboard
                </h2>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {scope === "local" ? `${countryName} board` : "Every rank, live — pay to move up."}
                </p>
              </div>
            </div>
            {listingsBlock}
          </section>
        </>
      )}

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
