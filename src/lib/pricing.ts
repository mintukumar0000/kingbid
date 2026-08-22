// Core ranking / pricing rules.
//
// 1. New listings start at $5 minimum (whole dollars, $1 increments, $999,999 max)
// 2. Taking the #1 spot requires paying at least $5 more than the current top bid
// 3. Paying less than the #1 price still puts you on the board wherever that bid lands
// 4. Equal bids: the older bid keeps the higher rank
// 5. Raising an existing bid costs only the DIFFERENCE (minimum $1)
// 6. A completed payment is what claims the rank, not intent
// 7. Takeover: pay 5x the current top bid to lock #1 for 3 consecutive hours

export const MIN_BID = 5;
export const MAX_BID = 999_999;
export const TOP_SPOT_INCREMENT = 5;
export const RANK_INCREMENT = 1;
export const MIN_RAISE = 1;
export const TAKEOVER_MULTIPLIER = 5;
export const TAKEOVER_HOURS = 3;

export interface RankedListing {
  currentBid: number;
  takeoverUntil: Date | null;
}

export function isTakeoverActive(l: RankedListing, now = new Date()): boolean {
  return l.takeoverUntil !== null && l.takeoverUntil > now;
}

/** Price to claim the #1 spot given the current top bid. */
export function priceForTopSpot(currentTopBid: number): number {
  return currentTopBid > 0 ? currentTopBid + TOP_SPOT_INCREMENT : MIN_BID;
}

/** Price to claim a given rank, where `bidAtRank` is the bid currently holding it. */
export function priceForRank(rank: number, bidAtRank: number, currentTopBid: number): number {
  if (rank === 1) return priceForTopSpot(currentTopBid);
  return bidAtRank + RANK_INCREMENT;
}

/** Payment required for an existing listing to reach a target total. */
export function raisePayment(currentOwnBid: number, targetTotal: number): number {
  return Math.max(targetTotal - currentOwnBid, MIN_RAISE);
}

/** Price to lock #1 for TAKEOVER_HOURS via takeover. */
export function takeoverPrice(currentTopBid: number): number {
  return Math.max(currentTopBid, MIN_BID) * TAKEOVER_MULTIPLIER;
}

export function validateAmount(amount: number): string | null {
  if (!Number.isInteger(amount)) return "Bids must be whole US dollars.";
  if (amount < 1) return "Amount must be at least $1.";
  if (amount > MAX_BID) return `Maximum bid is $${MAX_BID.toLocaleString()}.`;
  return null;
}

/** Where a brand-new listing would land if it paid `amount` right now. */
export function estimateRankForNewBid(
  amount: number,
  entries: { currentBid: number; lastBidAt: string }[]
): number {
  if (amount < MIN_BID) return Math.max(1, entries.length + 1);
  const now = new Date().toISOString();
  const simulated = [...entries, { currentBid: amount, lastBidAt: now }].sort((a, b) => {
    if (b.currentBid !== a.currentBid) return b.currentBid - a.currentBid;
    return new Date(a.lastBidAt).getTime() - new Date(b.lastBidAt).getTime();
  });
  return simulated.findIndex((e) => e.lastBidAt === now) + 1;
}
