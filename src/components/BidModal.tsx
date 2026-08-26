"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardData } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";
import { REF_COOKIE } from "@/lib/brand";
import type { BoardScope } from "@/lib/geo";
import { BID_MODAL_NEW } from "@/lib/copy";
import { RevenueBandSelect } from "@/components/RevenueBandSelect";
import { NepalBidDisclosure } from "@/components/nepal/NepalBidDisclosure";
import { isCampaignUiEnabled } from "@/lib/nepal-campaign-config";
import type { RevenueBand } from "@/lib/revenue-bands";

export interface BidPrefill {
  mode: "new" | "claim" | "takeover";
  amount: number;
  targetRank?: number;
  targetTitle?: string;
  url?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  prefill: BidPrefill;
  board: LeaderboardData;
  scope?: BoardScope;
  countryName?: string | null;
  countryCode?: string;
}

export function BidModal({
  open,
  onClose,
  prefill,
  board,
  scope = "global",
  countryName,
  countryCode,
}: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(prefill.amount);
  const [revenueBand, setRevenueBand] = useState<RevenueBand | "">("");
  const [campaignAck, setCampaignAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(prefill.amount);
      setUrl(prefill.url ?? "");
      setError(null);
      setCampaignAck(false);
    }
  }, [open, prefill]);

  // Detect a raise: the entered URL matches a listing already on the board
  const existing = useMemo(() => {
    const norm = url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "")
      .replace(/^@/, "");
    if (!norm) return null;
    return (
      board.entries.find((e) => {
        const eNorm = e.url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
        const hNorm = e.handle?.toLowerCase().replace(/^@/, "");
        return eNorm === norm || (hNorm && hNorm === norm);
      }) ?? null
    );
  }, [url, board.entries]);

  const isTakeover = prefill.mode === "takeover";
  const minAmount = isTakeover ? board.takeoverPrice : existing ? 1 : board.minBid;
  const showCampaignDisclosure = isCampaignUiEnabled() && scope === "global" && !isTakeover;
  const resultingTotal = (existing?.currentBid ?? 0) + amount;
  const wouldBeTop = resultingTotal >= board.claimTopPrice || isTakeover;

  if (!open) return null;

  function referralSlugFromCookie(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp(`${REF_COOKIE}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!url.trim()) return setError("Enter a URL or @handle.");
    if (!existing && !title.trim() && !isTakeover) return setError("Enter a title for your listing.");
    if (!existing && !isTakeover && !revenueBand) {
      return setError("Pick a revenue band for Underdog rank.");
    }
    if (!Number.isInteger(amount) || amount < 1) return setError("Enter a whole dollar amount.");
    if (showCampaignDisclosure && !campaignAck) {
      return setError("Please confirm you understand the campaign settlement process.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          amount,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          email: email.trim() || undefined,
          isTakeover,
          referralSlug: referralSlugFromCookie(),
          scope,
          countryCode: scope === "local" ? countryCode : undefined,
          categorySlug: board.categorySlug ?? undefined,
          revenueBand: !existing && revenueBand ? revenueBand : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="modal-in w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold">
            {isTakeover
              ? "🔒 Takeover #1 for 3 hours"
              : prefill.targetRank
                ? `Claim #${prefill.targetRank}`
                : "Get on the board"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-xl leading-none -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-muted mb-5">
          {isTakeover
            ? `Pay 5x the current top bid (${formatMoney(board.takeoverPrice)}) to lock the #1 spot for 3 consecutive hours. Nobody can displace you until it expires.`
            : scope === "local" && countryName
              ? `This bid counts on the ${countryName} board only. Payment claims your rank instantly.`
              : prefill.targetTitle
                ? `Outbid “${prefill.targetTitle}”. Payment claims the rank — instantly.`
                : BID_MODAL_NEW(board.minBid)}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Website URL or X @handle
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yoursite.com or @handle"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              autoFocus
            />
            {existing && (
              <p className="mt-1.5 text-xs text-accent">
                Already on the board at {formatMoney(existing.currentBid)} — you only pay the
                difference. Your total becomes {formatMoney(resultingTotal)}.
                {existing.creditBalance > 0 && (
                  <> You have ${existing.creditBalance} referral credit — applied automatically at checkout.</>
                )}
              </p>
            )}
          </div>

          {!existing && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Your product name"
                  maxLength={80}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Description <span className="opacity-60">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One or two sentences about what you do"
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
              <RevenueBandSelect value={revenueBand} onChange={setRevenueBand} required />
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Email <span className="opacity-60">(optional — get alerted when you&apos;re outbid)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              {isTakeover ? "Takeover price" : "Amount (USD, whole dollars)"}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAmount((a) => Math.max(minAmount, a - 1))}
                disabled={isTakeover}
                className="h-11 w-11 rounded-lg border border-border bg-surface-2 text-lg hover:border-border-strong disabled:opacity-40 transition-colors"
              >
                −
              </button>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                <input
                  type="number"
                  min={minAmount}
                  max={999999}
                  step={1}
                  value={amount}
                  disabled={isTakeover}
                  onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                  className="tabular w-full rounded-lg border border-border bg-surface-2 pl-7 pr-3 py-2.5 text-base font-semibold outline-none focus:border-accent transition-colors disabled:opacity-70"
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount((a) => Math.min(999999, a + 1))}
                disabled={isTakeover}
                className="h-11 w-11 rounded-lg border border-border bg-surface-2 text-lg hover:border-border-strong disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {isTakeover ? (
                <>Locks #1 until 3 hours after payment. Bid to beat right now: {formatMoney(board.topBid)}.</>
              ) : wouldBeTop ? (
                <span className="text-gold">This takes the #1 spot 👑</span>
              ) : (
                <>
                  #1 costs {formatMoney(board.claimTopPrice)}
                  {existing ? ` (pay ${formatMoney(Math.max(board.claimTopPrice - existing.currentBid, 1))} more)` : ""}. Paying
                  less still puts you on the board at whatever rank your total can take.
                </>
              )}
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
          )}

          {showCampaignDisclosure && (
            <NepalBidDisclosure amount={amount} acknowledged={campaignAck} onAcknowledge={setCampaignAck} />
          )}

          <button
            type="submit"
            disabled={submitting || (showCampaignDisclosure && !campaignAck)}
            className="w-full rounded-full bg-accent px-4 py-3 text-base font-bold text-white hover:brightness-110 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            {submitting
              ? "Redirecting to checkout…"
              : showCampaignDisclosure
                ? `Continue to payment → ${formatMoney(amount || 0)}`
                : `Pay ${formatMoney(amount || 0)} & claim`}
          </button>
          <p className="text-center text-[11px] text-muted">
            Payments processed securely. All sales final — see the{" "}
            <a href="/rules" className="underline hover:text-foreground">rules</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
