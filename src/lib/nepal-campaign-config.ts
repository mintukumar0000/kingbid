export const NEPAL_CAMPAIGN = {
  name: "Nepal Flood Relief",
  recipient: "Nepal Red Cross Society",
  goalAmount: 20_000,
  minBid: 5,
  platformFee: 0,
  startDate: new Date("2026-08-17T00:00:00.000Z"),
  endDate: new Date("2026-08-25T23:59:59.999Z"),
  contactEmail: "heyquixy@gmail.com",
} as const;

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
