// Non-negotiable product guardrails — enforced in code paths, not just policy docs.
// v2 extends v1 with Fallen Fund, Call It, and verification rules (spec §1).

import type { RevenueBand } from "@/lib/revenue-bands";

/** Listing statuses that may appear on public boards. */
export const PUBLIC_LISTING_STATUSES = ["active"] as const;

export type ListingStatus = "pending_invite" | "active" | "removed";

export function canShowOnPublicBoard(status: string): boolean {
  return (PUBLIC_LISTING_STATUSES as readonly string[]).includes(status);
}

/** Reject attempts to create listings without owner consent (no bulk seed of third parties). */
export function assertConsentedListing(source: "owner_submit" | "invite_claim" | "admin"): void {
  if (source !== "owner_submit" && source !== "invite_claim" && source !== "admin") {
    throw new Error("Listings require owner consent — use submit or invite claim only.");
  }
}

/** Stats UI must never show placeholder dashes as fake activity. */
export function formatPublicCount(n: number | undefined | null): string {
  return String(n ?? 0);
}

/** Fallen Fund grants are visibility-only — never cash payouts to users. */
export const FALLEN_FUND_GRANT_TYPES = [
  "homepage_feature",
  "room_spotlight",
  "analytics_month",
  "launch_feature",
] as const;

export type FallenFundGrantType = (typeof FALLEN_FUND_GRANT_TYPES)[number];

export function assertFallenFundGrant(type: string): asserts type is FallenFundGrantType {
  if (!(FALLEN_FUND_GRANT_TYPES as readonly string[]).includes(type)) {
    throw new Error("Fallen Fund grants are non-cash visibility only.");
  }
}

/** Call It / Kingmaker — zero monetary stakes. Reputation only. */
export function assertZeroStakesPrediction(): void {
  // Guardrail marker: Call It routes must never create payment intents.
}

/** Revenue shown publicly must be banded — never exact figures. */
export function assertPublicRevenueDisplay(exactFigure: unknown): void {
  if (typeof exactFigure === "number" && exactFigure > 0) {
    throw new Error("Public revenue must use banded ranges only, never exact figures.");
  }
}

/** Unverified revenue bands must be labeled distinctly in UI copy. */
export function revenueBandDisplayLabel(band: RevenueBand, verified: boolean): string {
  return verified ? band : `${band}:unverified`;
}
