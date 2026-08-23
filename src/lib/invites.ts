import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { assertConsentedListing } from "@/lib/guardrails";

export async function createInvite(input: {
  invitedContact: string;
  categoryId?: string | null;
}): Promise<{ claimToken: string; claimUrl: string }> {
  const claimToken = randomBytes(24).toString("hex");
  await prisma.invite.create({
    data: {
      invitedContact: input.invitedContact.trim(),
      categoryId: input.categoryId ?? null,
      claimToken,
      status: "sent",
    },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { claimToken, claimUrl: `${base}/claim/${claimToken}` };
}

export async function getInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { claimToken: token },
    include: { category: { select: { slug: true, name: true } } },
  });
}

export async function markInviteClaimed(token: string): Promise<void> {
  await prisma.invite.update({
    where: { claimToken: token },
    data: { status: "claimed" },
  });
}

export function validateInviteClaim(): void {
  assertConsentedListing("invite_claim");
}
