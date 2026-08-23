// Non-negotiable product guardrails — enforced in code paths, not just policy docs.

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
