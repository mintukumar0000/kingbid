"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LeaderboardData } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";
import { raisePayment } from "@/lib/pricing";
import { REF_COOKIE } from "@/lib/brand";
import type { BoardScope } from "@/lib/geo";
import { BID_MODAL_NEW } from "@/lib/copy";
import { RevenueBandSelect } from "@/components/RevenueBandSelect";
import type { RevenueBand } from "@/lib/revenue-bands";

export interface BidPrefill {
  mode: "new" | "claim" | "takeover";
  amount: number;
  /** When true, `amount` is the target total bid — converted to a raise increment if URL matches an existing listing. */
  amountIsTargetTotal?: boolean;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const convertedRaise = useRef(false);

  useEffect(() => {
    if (open) {
      setAmount(prefill.amount);
      setUrl(prefill.url ?? "");
      setError(null);
      convertedRaise.current = false;
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
        const displayNorm = e.displayUrl.toLowerCase().replace(/^@/, "");
        const slugNorm = e.slug.toLowerCase();
        return (
          eNorm === norm ||
          (hNorm && hNorm === norm) ||
          displayNorm === norm ||
          slugNorm === norm
        );
      }) ?? null
    );
  }, [url, board.entries]);

  useEffect(() => {
    if (!open || !existing || convertedRaise.current || prefill.mode === "takeover") return;
    if (prefill.amountIsTargetTotal) {
      setAmount(raisePayment(existing.currentBid, prefill.amount));
      convertedRaise.current = true;
    }
  }, [open, existing, prefill.amount, prefill.amountIsTargetTotal, prefill.mode]);

  const isTakeover = prefill.mode === "takeover";
  const minAmount = isTakeover ? board.takeoverPrice : existing ? 1 : board.minBid;
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
        className="modal-in flex max-h-[min(90dvh,620px)] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[var(--shadow)] sm:max-w-sm sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <div className="mb-1 flex items-start justify-between">
            <h2 className="text-lg font-bold leading-tight">
              {isTakeover
                ? "🔒 Takeover #1 for 3 hours"
                : prefill.targetRank
                  ? `Steal rank #${prefill.targetRank}`
                  : "Steal the Crown"}
            </h2>
            <button
              onClick={onClose}
              className="-mt-1 text-xl leading-none text-muted hover:text-foreground"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-[13px] leading-snug text-muted">
            {isTakeover
              ? `Pay 5x the current top bid (${formatMoney(board.takeoverPrice)}) to lock #1 for 3 hours.`
              : scope === "local" && countryName
                ? `Counts on the ${countryName} board only. Payment claims your rank instantly.`
                : prefill.targetTitle
                  ? `Outbid “${prefill.targetTitle}”. Payment claims the rank instantly.`
                  : BID_MODAL_NEW(board.minBid)}
          </p>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Website URL or X @handle</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yoursite.com or @handle"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                autoFocus
              />
              {existing && (
                <p className="mt-1 text-[11px] text-accent">
                  On board at {formatMoney(existing.currentBid)} — pay the difference. Total becomes{" "}
                  {formatMoney(resultingTotal)}.
                  {existing.creditBalance > 0 && <> ${existing.creditBalance} referral credit at checkout.</>}
                </p>
              )}
            </div>

            {!existing && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Your product name"
                    maxLength={80}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Description <span className="opacity-60">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="One or two sentences about what you do"
                    maxLength={200}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                  />
                </div>
                <RevenueBandSelect value={revenueBand} onChange={setRevenueBand} required />
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Email <span className="opacity-60">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                {isTakeover ? "Takeover price" : "Amount (USD, whole dollars)"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.max(minAmount, a - 1))}
                  disabled={isTakeover}
                  className="h-10 w-10 rounded-lg border border-border bg-surface-2 text-lg transition-colors hover:border-border-strong disabled:opacity-40"
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
                    className="tabular w-full rounded-lg border border-border bg-surface-2 py-2 pl-7 pr-3 text-base font-semibold outline-none transition-colors focus:border-accent disabled:opacity-70"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.min(999999, a + 1))}
                  disabled={isTakeover}
                  className="h-10 w-10 rounded-lg border border-border bg-surface-2 text-lg transition-colors hover:border-border-strong disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {isTakeover ? (
                  <>Locks #1 for 3 hours. Beat now: {formatMoney(board.topBid)}.</>
                ) : wouldBeTop ? (
                  <span className="text-[var(--crown-gold)]">This takes the crown 👑</span>
                ) : (
                  <>
                    #1 costs {formatMoney(board.claimTopPrice)}
                    {existing ? ` (+${formatMoney(Math.max(board.claimTopPrice - existing.currentBid, 1))})` : ""}.
                  </>
                )}
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-surface px-5 py-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[var(--crown-gold)] px-4 py-2.5 text-[15px] font-bold text-[#0a0908] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? "Redirecting to checkout…" : `🔥 Steal for ${formatMoney(amount || 0)}`}
            </button>
            <p className="mt-2 text-center text-[10px] text-muted">
              Secure checkout. All sales final — see the{" "}
              <a href="/rules" className="underline hover:text-foreground">
                rules
              </a>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
