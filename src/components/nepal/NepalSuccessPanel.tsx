"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { NEPAL_CAMPAIGN, NEPAL_PAYER_REASSURANCE_SHORT } from "@/lib/nepal-campaign-config";
import { VerificationRequestTrigger } from "@/components/nepal/VerificationRequestModal";

export function NepalSuccessPanel({
  rank,
  bidAmount,
  publicId,
  campaignRaised,
}: {
  rank: number | null;
  bidAmount: number;
  publicId: string | null;
  campaignRaised: number;
}) {
  const shareText = rank
    ? `I just claimed #${rank} on Kingbid — and my bid is helping Nepal flood relief. 🇳🇵`
    : `I just bid on Kingbid — supporting Nepal flood relief. 🇳🇵`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://kingbid.lol";
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <section className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft/40 p-5 text-left">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-accent">🇳🇵 Nepal Flood Relief</p>
      <p className="mt-2 text-[15px] font-semibold">Your campaign payment helps fund flood relief.</p>

      <dl className="mt-4 space-y-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Bid</dt>
          <dd className="font-semibold">{formatMoney(bidAmount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Payment</dt>
          <dd>🟢 Confirmed</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Campaign</dt>
          <dd>🇳🇵 {NEPAL_CAMPAIGN.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Settlement</dt>
          <dd>🟡 Awaiting settlement</dd>
        </div>
        {publicId && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Public transaction ID</dt>
            <dd className="font-mono-label text-[12px]">{publicId}</dd>
          </div>
        )}
      </dl>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        {NEPAL_PAYER_REASSURANCE_SHORT}{" "}
        <VerificationRequestTrigger
          className="font-medium text-accent hover:underline"
          label="Request verification →"
          defaultPaymentPublicId={publicId ?? undefined}
        />
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted">Share card</p>
        <p className="mt-2 text-[14px] font-medium">{shareText}</p>
        <p className="mt-2 text-[12px] text-muted">
          Rank {rank ? `#${rank}` : "—"} · Bid {formatMoney(bidAmount)} · Campaign total {formatMoney(campaignRaised)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={tweet}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white hover:brightness-110"
          >
            Share on X →
          </a>
          <Link
            href="/nepal-relief#ledger"
            className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent"
          >
            View campaign ledger →
          </Link>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent"
            onClick={() => navigator.clipboard.writeText(`${shareText} ${shareUrl}`)}
          >
            Copy link
          </button>
        </div>
      </div>
    </section>
  );
}
