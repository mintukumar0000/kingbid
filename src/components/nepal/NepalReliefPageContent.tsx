"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { NEPAL_CAMPAIGN, NEPAL_PAYER_REASSURANCE } from "@/lib/nepal-campaign-config";
import { RelativeTime } from "@/components/RelativeTime";
import { NepalReliefDashboard } from "@/components/nepal/NepalReliefDashboard";

type Payload = {
  enabled: boolean;
  campaign?: { phase: string; recipient: string; startDate: string; endDate: string };
  ledger?: {
    publicId: string;
    at: string;
    bidder: string;
    amount: number;
    paymentStatus: string;
    settlementStatus: string;
    donationStatus: string;
  }[];
  settlements?: {
    number: number;
    grossAmount: number;
    adjustments: number;
    netAmount: number;
    settlementDate: string;
    status: string;
    evidenceUrl: string | null;
    periodStart: string;
    periodEnd: string;
  }[];
  donations?: {
    number: number;
    amount: number;
    recipientName: string;
    donatedAt: string;
    status: string;
    receiptUrl: string | null;
  }[];
  timeline?: { key: string; title: string; status: string; at: string | null }[];
  totals?: { donated: number; receivedByKingbid: number };
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: "🟢 Paid",
    PENDING_SETTLEMENT: "🟡 Pending",
    SETTLED: "🟢 Settled",
    PENDING: "🟡 Pending",
    DONATED: "🟢 Donated",
    RECEIVED: "🟢 Received",
    CONFIRMED: "🟢 Confirmed",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function timelineIcon(status: string) {
  if (status === "completed") return "🟢";
  if (status === "pending") return "🟡";
  return "⚪";
}

export function NepalReliefPageContent() {
  const { data } = useSWR<Payload>("/api/nepal-relief", fetcher, { refreshInterval: 15_000 });

  if (!data?.enabled) {
    return <p className="text-muted">Nepal campaign transparency is currently unavailable.</p>;
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-10">
      <NepalReliefDashboard />

      {/* Money flow */}
      <section className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">How money moves</h2>
        <div className="mt-6 grid gap-2 text-center sm:grid-cols-5">
          {["USER BID", "DODO PAYMENTS", "KINGBID SETTLEMENT", "VERIFIED RELIEF ORG", "FLOOD RESPONSE"].map(
            (step, i, arr) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                  {step}
                </div>
                {i < arr.length - 1 && <span className="hidden text-muted sm:block">↓</span>}
              </div>
            )
          )}
        </div>
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          Payments are processed through <strong className="text-foreground">Dodo Payments</strong>. Campaign funds
          become available to Kingbid according to the payment provider&apos;s settlement process. After settlement,
          eligible campaign proceeds are transferred to{" "}
          <strong className="text-foreground">{NEPAL_CAMPAIGN.recipient}</strong>. Donation records and receipts are
          published here — not at checkout.
        </p>
        <div className="mt-5 rounded-xl border border-accent/25 bg-accent-soft/30 p-4">
          <p className="text-[13px] font-semibold text-foreground">Payer verification</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{NEPAL_PAYER_REASSURANCE}</p>
          <a
            href={`mailto:${NEPAL_CAMPAIGN.contactEmail}?subject=Nepal%20campaign%20verification%20request`}
            className="mt-3 inline-block text-[13px] font-semibold text-accent hover:underline"
          >
            Request verification → {NEPAL_CAMPAIGN.contactEmail}
          </a>
        </div>
      </section>

      {/* Ledger */}
      <section id="ledger" className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">Live campaign ledger</h2>
        <p className="mt-1 text-[13px] text-muted">Public IDs only — no emails, cards, or private payment data.</p>
        {!data.ledger?.length ? (
          <p className="mt-4 text-[13px] text-muted">No campaign payments recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Public ID</th>
                  <th className="py-2 pr-3">Bidder</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Payment</th>
                  <th className="py-2 pr-3">Settlement</th>
                  <th className="py-2">Donation</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((row) => (
                  <tr key={row.publicId} className="border-b border-border/60">
                    <td className="py-2.5 pr-3 text-muted">
                      {new Date(row.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 pr-3 font-mono-label text-[12px]">{row.publicId}</td>
                    <td className="py-2.5 pr-3">{row.bidder}</td>
                    <td className="py-2.5 pr-3 font-semibold">{formatMoney(row.amount)}</td>
                    <td className="py-2.5 pr-3">{statusBadge(row.paymentStatus)}</td>
                    <td className="py-2.5 pr-3">{statusBadge(row.settlementStatus)}</td>
                    <td className="py-2.5">{statusBadge(row.donationStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Settlements */}
      <section id="settlements" className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">Dodo settlements</h2>
        {!data.settlements?.length ? (
          <p className="mt-4 text-[13px] text-muted">
            No settlement has been recorded yet. Campaign funds are awaiting Dodo&apos;s settlement process.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.settlements.map((s) => (
              <div key={s.number} className="rounded-xl border border-border bg-surface-2/50 p-4">
                <p className="font-semibold">Settlement #{String(s.number).padStart(3, "0")}</p>
                <p className="mt-1 text-[12px] text-muted">
                  {fmtDate(s.periodStart)} – {fmtDate(s.periodEnd)}
                </p>
                <dl className="mt-3 space-y-1 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-muted">Gross</dt>
                    <dd className="font-medium">{formatMoney(s.grossAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Refunds/adjustments</dt>
                    <dd className="font-medium">{formatMoney(s.adjustments)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Net settlement</dt>
                    <dd className="font-semibold text-accent">{formatMoney(s.netAmount)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[12px]">{statusBadge(s.status)} · {fmtDate(s.settlementDate)}</p>
                {s.evidenceUrl && (
                  <a href={s.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[12px] text-accent hover:underline">
                    View evidence →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Donations */}
      <section id="donations" className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">🧾 Donation records</h2>
        {!data.donations?.length ? (
          <p className="mt-4 text-[13px] text-muted">
            No donation has been completed yet. Campaign funds are currently awaiting payment settlement.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.donations.map((d) => (
              <div key={d.number} className="rounded-xl border border-border bg-surface-2/50 p-4">
                <p className="font-semibold">Donation #{String(d.number).padStart(3, "0")}</p>
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Amount</dt>
                    <dd className="font-semibold text-accent">{formatMoney(d.amount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Recipient</dt>
                    <dd>{d.recipientName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Date</dt>
                    <dd>{fmtDate(d.donatedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[12px]">{statusBadge(d.status)}</p>
                {d.receiptUrl ? (
                  <a href={d.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] font-semibold text-accent hover:underline">
                    View official receipt →
                  </a>
                ) : (
                  <p className="mt-2 text-[12px] text-muted">Receipt pending publication.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Commitment */}
      <section className="nepal-commitment-card rounded-[18px] p-6 sm:p-8">
        <p className="kb-eyebrow">Kingbid commitment</p>
        <p className="font-mono-label mt-2 text-[48px] font-semibold leading-none text-accent">$0</p>
        <p className="mt-1 text-[14px] font-semibold">Platform revenue from this campaign</p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
          Kingbid takes $0 platform revenue from eligible campaign proceeds. The public ledger shows campaign payments,
          adjustments, settlement amounts, and final donations. Payment processor fees may still apply per Dodo
          Payments&apos; terms.
        </p>
      </section>

      {/* Trust */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Live numbers", "Campaign totals update as payments are confirmed."],
          ["Payment provider disclosed", "Payments are processed through Dodo Payments."],
          ["Settlement disclosed", "We publish how much was actually settled to Kingbid."],
          ["$0 Kingbid platform fee", "Kingbid does not take platform revenue from this campaign."],
          ["Public ledger", "Campaign transactions are trackable without exposing sensitive data."],
          ["Donation receipt", "The final receipt is published after the donation is completed."],
          [
            "Verification on request",
            "Need proof your payment reached charity? Email us — receipts and transfer details available.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="luxury-card p-4">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-[13px] text-muted">{body}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <section className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">Campaign timeline</h2>
        <ul className="mt-4 space-y-3">
          {data.timeline?.map((ev) => (
            <li key={ev.key} className="flex items-start gap-3 text-[14px]">
              <span aria-hidden>{timelineIcon(ev.status)}</span>
              <div>
                <p className="font-medium">{ev.title}</p>
                {ev.at && (
                  <p className="text-[12px] text-muted">
                    <RelativeTime date={ev.at} />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rules */}
      <section id="rules" className="luxury-card p-6 sm:p-8">
        <h2 className="font-display text-[22px] font-semibold">Campaign rules</h2>
        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-muted">
          <p>
            <strong className="text-foreground">Campaign period:</strong> August 27 – September 3, 2026 (UTC). Only
            successful global leaderboard payments completed during this window count toward the Nepal Flood Relief
            campaign.
          </p>
          <p>
            <strong className="text-foreground">Fundraising cap:</strong> None. Every eligible campaign payment during
            the window counts toward relief — there is no fixed goal. All amounts are tracked publicly on this page.
          </p>
          <p>
            <strong className="text-foreground">Minimum bid:</strong> ${NEPAL_CAMPAIGN.minBid} USD (same as the
            Kingbid board minimum). A successful payment means checkout completed and the bid marked paid in our
            system — not merely initiated.
          </p>
          <p>
            <strong className="text-foreground">Settlement:</strong> Dodo Payments settles funds to Kingbid on the
            provider&apos;s schedule (typically several business days). Until settlement is confirmed, funds show as
            &quot;Awaiting settlement.&quot;
          </p>
          <p>
            <strong className="text-foreground">Donation recipient:</strong> After settlement, eligible campaign
            proceeds are transferred to the <strong className="text-foreground">{NEPAL_CAMPAIGN.recipient}</strong>.
            Kingbid is not a registered charity — this is a temporary fundraising campaign operated through the
            Kingbid platform.
          </p>
          <p>
            <strong className="text-foreground">Refunds & chargebacks:</strong> Refunded or charged-back payments are
            removed from campaign totals and excluded from donation calculations. Adjustments appear in settlement
            records.
          </p>
          <p>
            <strong className="text-foreground">Receipts:</strong> Official donation receipts are published on this
            page only after the transfer to the relief organization is completed and verified.
          </p>
          <p>
            <strong className="text-foreground">If funds cannot be accepted:</strong> If the designated organization
            cannot accept a transfer, Kingbid will publish an update and redirect eligible proceeds to an alternative
            verified relief organization, with full disclosure on this page.
          </p>
          <p>
            <strong className="text-foreground">Separation from Kingbid revenue:</strong> Normal Kingbid platform
            revenue and the Fallen Fund are separate accounting categories and are never mixed with Nepal campaign
            proceeds on this ledger.
          </p>
          <p>
            Questions:{" "}
            <a href={`mailto:${NEPAL_CAMPAIGN.contactEmail}`} className="text-accent hover:underline">
              {NEPAL_CAMPAIGN.contactEmail}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
