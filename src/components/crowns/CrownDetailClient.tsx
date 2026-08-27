"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { CrownCard } from "@/components/crowns/CrownCard";
import { BidModal, type BidPrefill } from "@/components/BidModal";
import { getCrown, crownBidParams, CROWN_DISCLAIMER } from "@/lib/crowns";
import type { CrownDefinition } from "@/lib/crowns";
import type { CrownState } from "@/lib/crowns-data";
import type { LeaderboardData } from "@/lib/leaderboard";
import { PAGE_WIDE } from "@/lib/layout";
import { RelativeTime } from "@/components/RelativeTime";

type Payload = {
  crown: CrownDefinition;
  state: CrownState;
  history: { rank: number; handle: string; bid: number; at: string; isCurrent: boolean }[];
};

export function CrownDetailClient({ slug }: { slug: string }) {
  const { data } = useSWR<Payload>(`/api/crowns/${slug}`, fetcher, { refreshInterval: 10_000 });
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<BidPrefill>({ mode: "new", amount: 5 });
  const [board, setBoard] = useState<LeaderboardData | null>(null);

  async function openSteal(crown: CrownState) {
    const def = getCrown(crown.slug);
    if (!def) return;
    const params = crownBidParams(def);
    const qs = new URLSearchParams({ page: "1", limit: "50", scope: params.scope });
    if (params.countryCode) qs.set("country", params.countryCode);
    if (params.categorySlug) qs.set("category", params.categorySlug);
    const res = await fetch(`/api/listings?${qs}`);
    setBoard((await res.json()) as LeaderboardData);
    setPrefill({ mode: "new", amount: crown.nextBid, amountIsTargetTotal: true });
    setModalOpen(true);
  }

  if (!data) {
    return (
      <div className={`${PAGE_WIDE} py-20 text-center text-muted`}>Loading crown…</div>
    );
  }

  const { crown, state, history } = data;
  const shareText = state.hasKing
    ? `👑 ${state.kingHandle} is King of ${crown.name.replace("King of ", "")} on KingBid — ${formatMoney(state.currentBid)}. Someone can steal the crown.`
    : `👑 ${crown.name} is unclaimed on KingBid. Be the first King.`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/crown/${slug}` : `https://kingbid.lol/crown/${slug}`;
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <div className={`${PAGE_WIDE} py-10 sm:py-14`}>
        <Link href="/#live-crowns" className="text-[13px] font-medium text-muted hover:text-[var(--crown-gold)]">
          ← All crowns
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {state.isNewKing && (
              <div className="mb-6 rounded-xl border border-[var(--crown-gold)]/40 bg-[var(--crown-gold)]/10 px-4 py-3">
                <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--crown-gold)]">🚨 New King</p>
                <p className="mt-1 text-[14px] text-foreground">
                  {state.kingHandle} just stole the crown for {formatMoney(state.currentBid)}.
                </p>
              </div>
            )}

            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--crown-gold)]">
              {state.flag ? `${state.flag} ` : "👑 "}
              {state.headline}
            </p>

            {state.hasKing ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Current King</p>
                <p className="mt-1 text-[28px] font-bold">{state.kingHandle}</p>
                <p className="font-mono-label mt-4 text-[48px] font-bold tabular text-[var(--crown-gold)] sm:text-[56px]">
                  {formatMoney(state.currentBid)}
                </p>
                <p className="mt-2 text-[15px] text-muted">
                  Next bid <span className="font-bold text-foreground">{formatMoney(state.nextBid)}</span>
                </p>
                {state.previousKing && (
                  <p className="mt-3 text-[13px] text-muted">
                    Previous King: {state.previousKing.handle} — {formatMoney(state.previousKing.bid)}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[20px] font-bold">No King yet</p>
                <p className="mt-2 text-muted">Be the first to claim this crown.</p>
                <p className="font-mono-label mt-4 text-[40px] font-bold tabular text-[var(--crown-gold)]">
                  {formatMoney(state.nextBid)}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openSteal(state)}
                className="rounded-full bg-[var(--crown-gold)] px-8 py-3 text-[14px] font-bold uppercase tracking-wide text-[#0a0908] hover:brightness-110"
              >
                {state.hasKing ? "🔥 Steal the Crown" : "👑 Claim the Crown"}
              </button>
            </div>

            <p className="mt-4 text-[12px] text-muted">
              {state.watchers} watching · {state.bidCount} bids
              {state.lastBidAt && (
                <>
                  {" "}
                  · last bid <RelativeTime date={state.lastBidAt} />
                </>
              )}
            </p>

            <section className="mt-12">
              <h2 className="font-display text-[20px] font-semibold">Crown History</h2>
              {!history.length ? (
                <p className="mt-3 text-[13px] text-muted">No reign history yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {history.map((h) => (
                    <li
                      key={`${h.at}-${h.handle}`}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-[14px] ${
                        h.isCurrent ? "border-[var(--crown-gold)]/40 bg-[var(--crown-gold)]/5" : "border-border"
                      }`}
                    >
                      <span className="font-semibold">{h.handle}</span>
                      <span className="tabular font-bold text-[var(--crown-gold)]">{formatMoney(h.bid)}</span>
                      <span className="text-[12px] text-muted">{h.isCurrent ? "CURRENT" : <RelativeTime date={h.at} />}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-[20px] font-semibold">About this Crown</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{crown.description}</p>
              {crown.disclaimer && (
                <p className="mt-3 text-[12px] leading-relaxed text-muted/80">{crown.disclaimer}</p>
              )}
              <p className="mt-3 text-[12px] text-muted">Highest valid bid wins. Transparent auction rules.</p>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="crown-share-card rounded-2xl border border-[var(--crown-gold)]/30 bg-gradient-to-b from-[#1a1612] to-[#0f0d0b] p-6 text-center">
              <p className="text-3xl">👑</p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--crown-gold)]">
                {state.headline}
              </p>
              <p className="mt-2 text-[18px] font-bold">{state.hasKing ? state.kingHandle : "Unclaimed"}</p>
              <p className="font-mono-label mt-3 text-[32px] font-bold tabular text-[var(--crown-gold)]">
                {formatMoney(state.currentBid || state.nextBid)}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-widest text-muted">Current King</p>
              <p className="mt-4 text-[11px] text-muted">Someone can take the crown.</p>
              <p className="mt-2 text-[11px] font-bold tracking-widest text-muted">KINGBID.LOL</p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Share</p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={tweet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--crown-gold)] py-2 text-center text-[13px] font-bold text-[#0a0908]"
                >
                  Share on X
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`${shareText} ${shareUrl}`)}
                  className="rounded-full border border-border py-2 text-[13px] font-semibold hover:border-[var(--crown-gold)]"
                >
                  Copy link
                </button>
              </div>
            </div>
          </aside>
        </div>

        {crown.disclaimer && (
          <p className="mt-12 border-t border-border pt-6 text-[12px] text-muted">{CROWN_DISCLAIMER}</p>
        )}
      </div>

      {board && (
        <BidModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          prefill={prefill}
          board={board}
          scope={crownBidParams(crown).scope}
          countryCode={crown.countryCode}
        />
      )}
    </>
  );
}
