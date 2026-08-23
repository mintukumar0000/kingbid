// KingBid voice — original copy, not mirrored from competitors.

import { formatMoney } from "@/lib/format";

/** Format a live stat; never use "—" — show 0 while loading or when empty. */
export function liveStat(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("en-US");
}

export function heroSubtext(minBid: number, scope: "global" | "local", label?: string): string {
  if (scope === "local" && label) {
    return `Rank on the ${label} board only. Minimum bid ${formatMoney(minBid)} — outpay rivals in your region.`;
  }
  if (label) {
    return `Minimum ${formatMoney(minBid)} on ${label}. Pay less than #1 and you still get a rank — just not the crown.`;
  }
  return `Minimum ${formatMoney(minBid)} to land on the board. Pay less than #1 and you still get a rank — just not the crown.`;
}

export function emptyBoardMessage(minBid: number, scope: "global" | "local", label?: string): string {
  if (scope === "local" && label) {
    return `0 listings on the ${label} board — founding #1 is ${formatMoney(minBid)}.`;
  }
  if (label) {
    return `0 listings on ${label} — founding #1 is ${formatMoney(minBid)}.`;
  }
  return `0 listings yet — founding #1 is ${formatMoney(minBid)}. Cheapest it will ever be.`;
}

export const REVENUE_TICKER_LINE = "Total raised on Kingbid since launch";
export const BID_MODAL_NEW = (minBid: number) =>
  `Minimum ${formatMoney(minBid)}. Rank is set only by how much you pay — nothing else.`;
