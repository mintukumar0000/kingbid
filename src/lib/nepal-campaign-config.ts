export const NEPAL_CAMPAIGN = {
  name: "Nepal Flood Relief",
  recipient: "Nepal Red Cross Society",
  minBid: 5,
  platformFee: 0,
  startDate: new Date("2026-08-27T00:00:00.000Z"),
  endDate: new Date("2026-09-03T23:59:59.999Z"),
  contactEmail: "heyquixy@gmail.com",
} as const;

/** Shown to payers — full proceeds to charity; founder offers verification on request. */
export const NEPAL_PAYER_REASSURANCE = `After Dodo payment processing, 100% of eligible campaign proceeds go to ${NEPAL_CAMPAIGN.recipient}. Kingbid takes $0 platform fee. If you need any verification — receipts, transfer proof, or campaign details — I'm happy to provide it.`;

export const NEPAL_PAYER_REASSURANCE_SHORT = `100% goes to ${NEPAL_CAMPAIGN.recipient} after Dodo settlement. Need verification? Happy to provide it.`;

/** Open-ended milestones for timeline display — not a fundraising cap. */
export const NEPAL_FUNDRAISING_MILESTONES = [100, 500, 1_000, 5_000, 10_000, 20_000] as const;

export function isCampaignUiEnabled(): boolean {
  return process.env.NEPAL_CAMPAIGN_ENABLED !== "false";
}

export function isCampaignPaymentEligible(at: Date): boolean {
  return at >= NEPAL_CAMPAIGN.startDate && at <= NEPAL_CAMPAIGN.endDate;
}

export function campaignPhase(): "upcoming" | "live" | "closed" {
  const now = new Date();
  if (now < NEPAL_CAMPAIGN.startDate) return "upcoming";
  if (now <= NEPAL_CAMPAIGN.endDate) return "live";
  return "closed";
}
