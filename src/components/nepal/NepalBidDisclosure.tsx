"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { campaignPhase, isCampaignPaymentEligible, NEPAL_CAMPAIGN } from "@/lib/nepal-campaign-config";

export function NepalBidDisclosure({
  amount,
  acknowledged,
  onAcknowledge,
}: {
  amount: number;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
}) {
  const phase = campaignPhase();
  const countsTowardCampaign = phase === "live" && isCampaignPaymentEligible(new Date());

  return (
    <div className="rounded-xl border border-accent/25 bg-accent-soft/50 p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-accent">🇳🇵 Nepal Flood Relief</p>
      <dl className="mt-3 space-y-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Your bid</dt>
          <dd className="font-semibold">{formatMoney(amount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Kingbid platform fee</dt>
          <dd className="font-semibold text-green">${NEPAL_CAMPAIGN.platformFee}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Payment processor</dt>
          <dd className="font-medium">Dodo Payments</dd>
        </div>
      </dl>
      {countsTowardCampaign ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Eligible campaign payments are settled to Kingbid via Dodo, then transferred to{" "}
          {NEPAL_CAMPAIGN.recipient} after settlement.
        </p>
      ) : (
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Campaign window: Aug 27 – Sep 3, 2026. This bid still claims leaderboard rank. See{" "}
          <Link href="/nepal-relief" className="text-accent hover:underline">
            campaign accounting
          </Link>{" "}
          for transparency.
        </p>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I understand that campaign proceeds are settled through Kingbid before being transferred to the designated
          relief organization.
        </span>
      </label>
    </div>
  );
}
