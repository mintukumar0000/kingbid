import { prisma } from "@/lib/db";
import { assertFallenFundGrant, type FallenFundGrantType } from "@/lib/guardrails";

/** Published platform cut — consistency matters more than the exact %. */
export const FALLEN_FUND_REVENUE_PCT = Number(process.env.FALLEN_FUND_PCT ?? "5") / 100;

export const FALLEN_FUND_SELECTION_RULE =
  "top_10_underdog_dethroned_this_week_by_sacrifice_score";

export async function accrueWeeklyPool(): Promise<string> {
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3_600_000);

  const revenue = await prisma.bid.aggregate({
    where: {
      status: "completed",
      completedAt: { gte: weekStart, lt: weekEnd },
    },
    _sum: { amount: true },
  });

  const poolCents = Math.round((revenue._sum.amount ?? 0) * 100 * FALLEN_FUND_REVENUE_PCT);

  const pool = await prisma.fallenFundPool.upsert({
    where: { weekStart },
    create: { weekStart, totalPoolCents: poolCents, status: "accruing" },
    update: { totalPoolCents: poolCents },
  });

  return pool.id;
}

/** Deterministic grant selection — never random. Grants are visibility-only. */
export async function distributeFallenFund(poolId: string): Promise<number> {
  const pool = await prisma.fallenFundPool.findUniqueOrThrow({ where: { id: poolId } });
  if (pool.status === "distributed") return 0;

  const weekStart = pool.weekStart;
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3_600_000);

  const dethroned = await prisma.dethronement.findMany({
    where: { occurredAt: { gte: weekStart, lt: weekEnd } },
    select: { listingId: true },
  });
  const dethronedIds = [...new Set(dethroned.map((d) => d.listingId))];
  if (dethronedIds.length === 0) {
    await prisma.fallenFundPool.update({ where: { id: poolId }, data: { status: "distributed" } });
    return 0;
  }

  const scores = await prisma.underdogScore.findMany({
    where: { listingId: { in: dethronedIds } },
    orderBy: [{ sacrificeScore: "desc" }, { computedAt: "desc" }],
    take: 30,
  });

  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const s of scores) {
    if (seen.has(s.listingId)) continue;
    seen.add(s.listingId);
    recipients.push(s.listingId);
    if (recipients.length >= 10) break;
  }

  const grantTypes: FallenFundGrantType[] = [
    "homepage_feature",
    "room_spotlight",
    "analytics_month",
    "launch_feature",
  ];

  let granted = 0;
  for (let i = 0; i < recipients.length; i++) {
    const grantType = grantTypes[i % grantTypes.length]!;
    assertFallenFundGrant(grantType);
    await prisma.fallenFundGrant.create({
      data: {
        poolId,
        recipientListingId: recipients[i]!,
        grantType,
        selectionRuleUsed: FALLEN_FUND_SELECTION_RULE,
      },
    });
    granted++;
  }

  await prisma.fallenFundPool.update({ where: { id: poolId }, data: { status: "distributed" } });
  return granted;
}

export async function nominateOnDethronement(
  dethronementId: string,
  nominatorListingId: string,
  nomineeListingId: string
): Promise<void> {
  await prisma.dethronementNomination.create({
    data: { dethronementId, nominatorListingId, nomineeListingId },
  });
}
