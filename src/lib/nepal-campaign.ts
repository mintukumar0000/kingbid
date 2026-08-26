import { prisma } from "@/lib/db";
import {
  NEPAL_CAMPAIGN,
  NEPAL_FUNDRAISING_MILESTONES,
  isCampaignPaymentEligible,
  isCampaignUiEnabled,
  campaignPhase,
} from "@/lib/nepal-campaign-config";

export { NEPAL_CAMPAIGN, NEPAL_FUNDRAISING_MILESTONES, isCampaignPaymentEligible, isCampaignUiEnabled, campaignPhase } from "@/lib/nepal-campaign-config";

function bidderLabel(displayUrl: string | null | undefined, email: string | null | undefined): string {
  if (displayUrl?.trim()) return displayUrl.trim();
  return "Anonymous";
}

async function nextPublicId(): Promise<string> {
  const count = await prisma.nepalCampaignPayment.count();
  return `KB-NP-${String(count + 1).padStart(6, "0")}`;
}

/** Backfill campaign rows from completed global bids during the campaign window. */
export async function syncCampaignPaymentsFromBids(): Promise<void> {
  const existing = await prisma.nepalCampaignPayment.findMany({ select: { paymentId: true } });
  const existingSet = new Set(existing.map((e) => e.paymentId));

  const bids = await prisma.bid.findMany({
    where: {
      status: "completed",
      scope: "global",
      completedAt: {
        gte: NEPAL_CAMPAIGN.startDate,
        lte: NEPAL_CAMPAIGN.endDate,
      },
    },
    include: { listing: { select: { displayUrl: true } } },
    orderBy: { completedAt: "asc" },
  });

  for (const bid of bids) {
    if (existingSet.has(bid.paymentId)) continue;
    const publicId = await nextPublicId();
    await prisma.nepalCampaignPayment.create({
      data: {
        publicId,
        paymentId: bid.paymentId,
        bidId: bid.id,
        amount: bid.amount,
        bidderLabel: bidderLabel(bid.listing.displayUrl, bid.email),
        paymentStatus: "PAID",
        settlementStatus: "PENDING_SETTLEMENT",
        donationStatus: "PENDING",
        paidAt: bid.completedAt ?? bid.createdAt,
      },
    });
    existingSet.add(bid.paymentId);
  }
}

/** Record a campaign payment after bid settlement — non-blocking for normal bid flow. */
export async function recordCampaignPayment(paymentId: string): Promise<void> {
  if (!isCampaignUiEnabled()) return;

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: { select: { displayUrl: true } } },
  });
  if (!bid || bid.status !== "completed" || bid.scope !== "global") return;

  const paidAt = bid.completedAt ?? new Date();
  if (!isCampaignPaymentEligible(paidAt)) return;

  const exists = await prisma.nepalCampaignPayment.findUnique({ where: { paymentId } });
  if (exists) return;

  const publicId = await nextPublicId();
  await prisma.nepalCampaignPayment.create({
    data: {
      publicId,
      paymentId: bid.paymentId,
      bidId: bid.id,
      amount: bid.amount,
      bidderLabel: bidderLabel(bid.listing.displayUrl, bid.email),
      paymentStatus: "PAID",
      settlementStatus: "PENDING_SETTLEMENT",
      donationStatus: "PENDING",
      paidAt,
    },
  });
}

export async function getCampaignPaymentByPaymentId(paymentId: string) {
  return prisma.nepalCampaignPayment.findUnique({ where: { paymentId } });
}

function sumPaid(payments: { amount: number; paymentStatus: string; settlementStatus: string; donationStatus: string }[]) {
  const successful = payments.filter((p) => p.paymentStatus === "PAID");
  const successfulTotal = successful.reduce((s, p) => s + p.amount, 0);
  const awaitingSettlement = successful
    .filter((p) => p.settlementStatus === "PENDING_SETTLEMENT")
    .reduce((s, p) => s + p.amount, 0);
  const receivedByKingbid = successful
    .filter((p) => p.settlementStatus === "SETTLED")
    .reduce((s, p) => s + p.amount, 0);
  const donated = successful.filter((p) => p.donationStatus === "DONATED").reduce((s, p) => s + p.amount, 0);

  return { successfulTotal, awaitingSettlement, receivedByKingbid, donated, paymentCount: successful.length };
}

export async function getCampaignDashboard() {
  await syncCampaignPaymentsFromBids();

  const [payments, settlements, donations] = await Promise.all([
    prisma.nepalCampaignPayment.findMany({
      orderBy: { paidAt: "desc" },
      take: 200,
    }),
    prisma.nepalCampaignSettlement.findMany({ orderBy: { settlementNumber: "asc" } }),
    prisma.nepalCampaignDonation.findMany({ orderBy: { donationNumber: "asc" } }),
  ]);

  const totals = sumPaid(payments);
  const phase = campaignPhase();

  const timeline = buildTimeline(totals, payments, settlements, donations, phase);

  return {
    campaign: {
      ...NEPAL_CAMPAIGN,
      phase,
      uiEnabled: isCampaignUiEnabled(),
    },
    totals: {
      raised: totals.successfulTotal,
      awaitingSettlement: totals.awaitingSettlement,
      receivedByKingbid: totals.receivedByKingbid,
      donated: totals.donated,
      paymentCount: totals.paymentCount,
    },
    ledger: payments.map((p) => ({
      id: p.id,
      publicId: p.publicId,
      at: p.paidAt.toISOString(),
      bidder: p.bidderLabel,
      amount: p.amount,
      paymentStatus: p.paymentStatus,
      settlementStatus: p.settlementStatus,
      donationStatus: p.donationStatus,
    })),
    settlements: settlements.map((s) => ({
      id: s.id,
      number: s.settlementNumber,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
      grossAmount: s.grossAmount,
      adjustments: s.adjustments,
      netAmount: s.netAmount,
      settlementDate: s.settlementDate.toISOString(),
      status: s.status,
      evidenceUrl: s.evidenceUrl,
    })),
    donations: donations.map((d) => ({
      id: d.id,
      number: d.donationNumber,
      amount: d.amount,
      recipientName: d.recipientName,
      donatedAt: d.donatedAt.toISOString(),
      status: d.status,
      receiptUrl: d.receiptUrl,
    })),
    timeline,
    updatedAt: new Date().toISOString(),
  };
}

function buildTimeline(
  totals: ReturnType<typeof sumPaid>,
  payments: { paidAt: Date }[],
  settlements: { settlementDate: Date; status: string }[],
  donations: { donatedAt: Date; status: string; receiptUrl: string | null }[],
  phase: ReturnType<typeof campaignPhase>
) {
  const firstPayment = payments.length ? payments[payments.length - 1]!.paidAt : null;
  const milestoneEvents = NEPAL_FUNDRAISING_MILESTONES.filter((amount) => totals.successfulTotal >= amount).map(
    (amount) => ({
      key: `milestone_${amount}`,
      title: `$${amount.toLocaleString()} raised`,
      status: "completed" as const,
      at: null as string | null,
    })
  );

  return [
    {
      key: "launched",
      title: "Campaign launched",
      status: "completed" as const,
      at: NEPAL_CAMPAIGN.startDate.toISOString(),
    },
    {
      key: "first_payment",
      title: "First campaign payment",
      status: firstPayment ? ("completed" as const) : phase === "closed" ? ("pending" as const) : ("upcoming" as const),
      at: firstPayment?.toISOString() ?? null,
    },
    ...milestoneEvents,
    {
      key: "closed",
      title: "Campaign closed",
      status: phase === "closed" ? ("completed" as const) : phase === "live" ? ("upcoming" as const) : ("upcoming" as const),
      at: NEPAL_CAMPAIGN.endDate.toISOString(),
    },
    {
      key: "settlement",
      title: "Settlement received by Kingbid",
      status: settlements.some((s) => s.status === "RECEIVED")
        ? ("completed" as const)
        : totals.awaitingSettlement > 0
          ? ("pending" as const)
          : ("upcoming" as const),
      at: settlements[0]?.settlementDate.toISOString() ?? null,
    },
    {
      key: "donation",
      title: "Donation to Nepal Red Cross Society",
      status: totals.donated > 0 ? ("completed" as const) : totals.receivedByKingbid > 0 ? ("pending" as const) : ("upcoming" as const),
      at: donations[0]?.donatedAt.toISOString() ?? null,
    },
    {
      key: "receipt",
      title: "Donation receipt published",
      status: donations.some((d) => d.receiptUrl)
        ? ("completed" as const)
        : totals.donated > 0
          ? ("pending" as const)
          : ("upcoming" as const),
      at: null as string | null,
    },
  ];
}

export async function createSettlement(input: {
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  adjustments?: number;
  netAmount: number;
  settlementDate: Date;
  evidenceUrl?: string;
}) {
  const last = await prisma.nepalCampaignSettlement.findFirst({ orderBy: { settlementNumber: "desc" } });
  const settlementNumber = (last?.settlementNumber ?? 0) + 1;

  const settlement = await prisma.nepalCampaignSettlement.create({
    data: {
      settlementNumber,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossAmount: input.grossAmount,
      adjustments: input.adjustments ?? 0,
      netAmount: input.netAmount,
      settlementDate: input.settlementDate,
      status: "RECEIVED",
      evidenceUrl: input.evidenceUrl ?? null,
    },
  });

  const pending = await prisma.nepalCampaignPayment.findMany({
    where: {
      paymentStatus: "PAID",
      settlementStatus: "PENDING_SETTLEMENT",
      paidAt: { gte: input.periodStart, lte: input.periodEnd },
    },
  });

  let remaining = input.netAmount;
  for (const p of pending) {
    if (remaining <= 0) break;
    await prisma.nepalCampaignPayment.update({
      where: { id: p.id },
      data: { settlementStatus: "SETTLED", settlementId: settlement.id },
    });
    remaining -= p.amount;
  }

  return settlement;
}

export async function createDonation(input: {
  amount: number;
  recipientName?: string;
  donatedAt: Date;
  receiptUrl?: string;
}) {
  const last = await prisma.nepalCampaignDonation.findFirst({ orderBy: { donationNumber: "desc" } });
  const donationNumber = (last?.donationNumber ?? 0) + 1;

  const donation = await prisma.nepalCampaignDonation.create({
    data: {
      donationNumber,
      amount: input.amount,
      recipientName: input.recipientName ?? NEPAL_CAMPAIGN.recipient,
      donatedAt: input.donatedAt,
      status: "CONFIRMED",
      receiptUrl: input.receiptUrl ?? null,
    },
  });

  const settled = await prisma.nepalCampaignPayment.findMany({
    where: {
      paymentStatus: "PAID",
      settlementStatus: "SETTLED",
      donationStatus: "PENDING",
    },
    orderBy: { paidAt: "asc" },
  });

  let remaining = input.amount;
  for (const p of settled) {
    if (remaining <= 0) break;
    await prisma.nepalCampaignPayment.update({
      where: { id: p.id },
      data: { donationStatus: "DONATED", donationId: donation.id },
    });
    remaining -= p.amount;
  }

  return donation;
}
