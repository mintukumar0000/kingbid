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
    <div className="rounded-lg border border-accent/25 bg-accent-soft/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">🇳🇵 Nepal Flood Relief</p>
      <p className="mt-1.5 text-[12px] text-muted">
        {formatMoney(amount)} bid · ${NEPAL_CAMPAIGN.platformFee} platform fee · Dodo Payments
      </p>
      {countsTowardCampaign ? (
        <p className="mt-1.5 text-[11px] leading-snug text-muted">
          Proceeds transfer to {NEPAL_CAMPAIGN.recipient} after settlement.{" "}
          <Link href="/nepal-relief" className="text-accent hover:underline">
            Live accounting →
          </Link>
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-muted">
          Aug 27 – Sep 3, 2026.{" "}
          <Link href="/nepal-relief" className="text-accent hover:underline">
            Campaign accounting →
          </Link>
        </p>
      )}
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-muted">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledge(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>I understand campaign proceeds are settled through Kingbid before transfer to the relief org.</span>
      </label>
    </div>
  );
}
