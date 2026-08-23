// Self-reported revenue bands — never store exact figures publicly.

export const REVENUE_BANDS = [
  "0",
  "1-100",
  "100-1k",
  "1k-10k",
  "10k-50k",
  "50k-plus",
] as const;

export type RevenueBand = (typeof REVENUE_BANDS)[number];

/** Midpoint in USD for sacrifice score math (spec: bid ÷ band midpoint). */
export const REVENUE_BAND_MIDPOINT: Record<RevenueBand, number> = {
  "0": 0,
  "1-100": 50,
  "100-1k": 550,
  "1k-10k": 5_500,
  "10k-50k": 30_000,
  "50k-plus": 75_000,
};

export const REVENUE_BAND_LABELS: Record<RevenueBand, string> = {
  "0": "$0 MRR",
  "1-100": "$1–$100/mo",
  "100-1k": "$100–$1K/mo",
  "1k-10k": "$1K–$10K/mo",
  "10k-50k": "$10K–$50K/mo",
  "50k-plus": "$50K+/mo",
};

/** Public display — verified bands drop the unverified tag. */
export function formatRevenueBand(band: RevenueBand, verified: boolean): string {
  const label = REVENUE_BAND_LABELS[band];
  return verified ? label : `${label} (unverified)`;
}

export function isRevenueBand(v: string): v is RevenueBand {
  return (REVENUE_BANDS as readonly string[]).includes(v);
}

/** Banded public ranges only — never exact revenue figures. */
export function publicRevenueRange(band: RevenueBand): string {
  return REVENUE_BAND_LABELS[band];
}
