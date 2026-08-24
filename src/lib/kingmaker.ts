import { prisma } from "@/lib/db";
import { assertZeroStakesPrediction } from "@/lib/guardrails";
import { bumpKingbidScore } from "@/lib/users";
import { writePlatformEvent } from "@/lib/platform-events";
import { canAddDiscoveryBet } from "@/lib/keepers";

/** Free prediction — no payment path. Resolves nightly at midnight UTC. */
export async function createCallItPrediction(
  userId: string,
  boardId: string,
  predictedListingId: string
) {
  assertZeroStakesPrediction();

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.callItPrediction.findFirst({
    where: { userId, boardId, resolved: false },
  });
  if (existing) {
    await prisma.callItPrediction.update({
      where: { id: existing.id },
      data: { predictedListingId, resolvesAt: tomorrow },
    });
    return existing.id;
  }

  const row = await prisma.callItPrediction.create({
    data: { userId, boardId, predictedListingId, resolvesAt: tomorrow },
  });
  return row.id;
}

export async function resolveCallItPredictions(): Promise<number> {
  const now = new Date();
  const pending = await prisma.callItPrediction.findMany({
    where: { resolved: false, resolvesAt: { lte: now } },
    include: { board: { select: { id: true } } },
  });

  let resolved = 0;
  for (const pred of pending) {
    const top = await prisma.listing.findFirst({
      where: { boardId: pred.boardId, currentBid: { gt: 0 }, status: "active" },
      orderBy: [{ currentBid: "desc" }, { lastBidAt: "asc" }],
      select: { id: true, displayUrl: true },
    });
    const correct = top?.id === pred.predictedListingId;
    await prisma.callItPrediction.update({
      where: { id: pred.id },
      data: { resolved: true, correct },
    });
    if (correct) {
      await bumpKingbidScore(pred.userId, 10, "call_it_correct");
      await writePlatformEvent({
        eventType: "kingmaker_called_it",
        boardId: pred.boardId,
        listingId: pred.predictedListingId,
        metadata: { displayUrl: top?.displayUrl, userId: pred.userId },
      });
    }
    resolved++;
  }
  return resolved;
}

export async function addDiscoveryBet(userId: string, listingId: string) {
  assertZeroStakesPrediction();
  const gate = await canAddDiscoveryBet(userId);
  if (!gate.ok) throw new Error(gate.error);

  await prisma.discoveryList.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
}

export async function getDiscoveryList(userId: string) {
  return prisma.discoveryList.findMany({
    where: { userId },
    include: {
      listing: {
        select: { slug: true, displayUrl: true, title: true, currentBid: true, boardId: true },
      },
    },
    orderBy: { calledAt: "desc" },
  });
}
