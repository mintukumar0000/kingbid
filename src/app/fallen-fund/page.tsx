import Link from "next/link";
import { prisma } from "@/lib/db";
import { FALLEN_FUND_SELECTION_RULE, FALLEN_FUND_REVENUE_PCT } from "@/lib/fallen-fund";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FallenFundPage() {
  const pools = await prisma.fallenFundPool.findMany({
    orderBy: { weekStart: "desc" },
    take: 4,
    include: {
      grants: {
        include: { recipient: { select: { displayUrl: true, slug: true } } },
      },
    },
  });

  const pct = Math.round(FALLEN_FUND_REVENUE_PCT * 100);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Fallen Fund</h1>
      <p className="mt-2 text-[15px] text-muted">
        {pct}% of KingBid&apos;s own platform revenue funds visibility grants — never cash, never from
        losing bidders&apos; payments. Recipients are chosen by a published rule, not a random draw.
      </p>
      <p className="mt-2 text-[13px] text-muted">
        Selection rule: <code className="text-foreground">{FALLEN_FUND_SELECTION_RULE}</code>
      </p>

      {process.env.FALLEN_FUND_ENABLED !== "true" && (
        <p className="mt-6 rounded-xl border border-border bg-accent-soft px-4 py-3 text-[13px]">
          Fallen Fund distribution is disabled until payment/legal review. Free dethronement nominations
          still work.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {pools.length === 0 ? (
          <p className="text-[13px] text-muted">0 weekly pools yet.</p>
        ) : (
          pools.map((pool) => (
            <div key={pool.id} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[13px] font-semibold">
                Week of {pool.weekStart.toLocaleDateString()} · {formatMoney(pool.totalPoolCents / 100)}{" "}
                accrued · {pool.status}
              </p>
              {pool.grants.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted">0 grants this week.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-[13px]">
                  {pool.grants.map((g) => (
                    <li key={g.id}>
                      <Link href={`/l/${g.recipient.slug}`} className="font-medium hover:underline">
                        {g.recipient.displayUrl}
                      </Link>
                      <span className="text-muted"> · {g.grantType.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
