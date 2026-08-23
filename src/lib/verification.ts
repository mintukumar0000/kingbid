import { prisma } from "@/lib/db";
import type { RevenueBand } from "@/lib/revenue-bands";
import { isRevenueBand } from "@/lib/revenue-bands";

export async function setSelfReportedRevenueBand(
  listingId: string,
  band: RevenueBand
): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: { revenueBand: band },
  });
}

export async function recordVerification(
  listingId: string,
  verificationType: "domain" | "founder" | "revenue_band" | "company",
  provider: string | null,
  revenueBand?: RevenueBand
): Promise<void> {
  await prisma.verification.create({
    data: {
      listingId,
      verificationType,
      provider,
      revenueBand: revenueBand ?? null,
      verifiedAt: new Date(),
    },
  });

  if (verificationType === "revenue_band" && revenueBand) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { revenueBand },
    });
  }
}

export async function isRevenueBandVerified(listingId: string): Promise<boolean> {
  const v = await prisma.verification.findFirst({
    where: {
      listingId,
      verificationType: "revenue_band",
      verifiedAt: { not: null },
    },
  });
  return !!v;
}

/** Domain TXT check stub — Phase 3 connects real DNS lookup. */
export async function verifyDomainDns(_domain: string, _token: string): Promise<boolean> {
  return false;
}

export function parseRevenueBandInput(raw: string): RevenueBand | null {
  return isRevenueBand(raw) ? raw : null;
}
