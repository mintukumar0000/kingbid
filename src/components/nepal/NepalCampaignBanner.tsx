"use client";

import Link from "next/link";
import { campaignPhase } from "@/lib/nepal-campaign-config";

export function NepalCampaignBanner() {
  const phase = campaignPhase();
  const live = phase === "live";
  const closed = phase === "closed";

  return (
    <div className="nepal-banner border-b border-accent/20">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="font-mono-label text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            🇳🇵 Kingbid for Nepal
          </p>
          <p className="mt-0.5 text-[14px] font-semibold text-foreground sm:text-[15px]">
            {closed
              ? "Campaign ended — full financial transparency remains public."
              : live
                ? "Every eligible bid helps fund flood relief."
                : "Nepal flood relief campaign — transparency from payment to donation."}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            Kingbid takes <span className="font-semibold text-foreground">$0 platform revenue</span> from this campaign.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <Link
            href="/nepal-relief"
            className="rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white hover:brightness-110"
          >
            View live transparency →
          </Link>
          <p className="text-[11px] text-muted">
            {live ? "🟢 Campaign live" : closed ? "⚪ Campaign closed" : "🟡 Upcoming"} · Payments processed by Dodo
            Payments
          </p>
        </div>
      </div>
    </div>
  );
}
