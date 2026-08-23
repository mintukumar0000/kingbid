import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { assertConsentedListing } from "@/lib/guardrails";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingbid.lol";
}

export async function createInvite(input: {
  invitedContact: string;
  categoryId?: string | null;
  reusable?: boolean;
}): Promise<{ claimToken: string; claimUrl: string; reusable: boolean }> {
  const claimToken = randomBytes(24).toString("hex");
  const reusable = input.reusable ?? false;
  await prisma.invite.create({
    data: {
      invitedContact: input.invitedContact.trim(),
      categoryId: input.categoryId ?? null,
      claimToken,
      status: "sent",
      reusable,
    },
  });

  return { claimToken, claimUrl: `${siteBase()}/claim/${claimToken}`, reusable };
}

export async function getOrCreatePromoInvite(categorySlug: string): Promise<{
  claimToken: string;
  claimUrl: string;
  categoryName: string;
}> {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true, name: true },
  });
  if (!category) throw new Error("Unknown category");

  const existing = await prisma.invite.findFirst({
    where: { categoryId: category.id, reusable: true, status: { not: "expired" } },
    select: { claimToken: true },
  });

  if (existing) {
    return {
      claimToken: existing.claimToken,
      claimUrl: `${siteBase()}/claim/${existing.claimToken}`,
      categoryName: category.name,
    };
  }

  const created = await createInvite({
    invitedContact: `promo:${categorySlug}`,
    categoryId: category.id,
    reusable: true,
  });

  return {
    claimToken: created.claimToken,
    claimUrl: created.claimUrl,
    categoryName: category.name,
  };
}

export async function getInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { claimToken: token },
    include: { category: { select: { slug: true, name: true } } },
  });
}

export async function markInviteClaimed(token: string): Promise<void> {
  const invite = await prisma.invite.findUnique({
    where: { claimToken: token },
    select: { reusable: true },
  });
  if (invite?.reusable) return;

  await prisma.invite.update({
    where: { claimToken: token },
    data: { status: "claimed" },
  });
}

export function validateInviteClaim(): void {
  assertConsentedListing("invite_claim");
}

export function inviteIsUsable(invite: { status: string; reusable: boolean }): boolean {
  if (invite.status === "expired") return false;
  if (invite.reusable) return true;
  return invite.status !== "claimed";
}
