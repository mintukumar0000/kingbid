import Link from "next/link";
import { Header } from "@/components/Header";
import { RowOfKings } from "@/components/RowOfKings";
import { getUnderdogRow } from "@/lib/underdog";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";
import { formatMoney } from "@/lib/format";
import { PAGE_WIDE } from "@/lib/layout";

export const dynamic = "force-dynamic";

export default async function UnderdogsPage() {
  const underdogs = await getUnderdogRow(null, 20);

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE_WIDE} py-10`}>
        <p className="kb-eyebrow">Conviction rank</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold">Underdog Row</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Sacrifice score = bid ÷ revenue band midpoint. Separate from the money leaderboard — big bids from
          smaller bands rank higher on conviction.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-[20px] font-semibold">Row of Kings</h2>
          <p className="mt-1 text-[13px] text-muted">Five crowned titles — money, sacrifice, breakout, traction, community.</p>
          <div className="mt-4">
            <RowOfKings />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-[20px] font-semibold">Sacrifice leaderboard</h2>
          {underdogs.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">
              No underdogs yet —{" "}
              <Link href="/#claim" className="text-accent hover:underline">
                claim a spot
              </Link>{" "}
              and pick a revenue band.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {underdogs.map((u, i) => (
                <li key={u.slug} className="luxury-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-muted">#{i + 1}</p>
                    <Link href={`/l/${u.slug}`} className="font-display text-[18px] font-semibold hover:text-accent">
                      {u.displayUrl}
                    </Link>
                    <p className="mt-1 text-[12px] text-muted">
                      {REVENUE_BAND_LABELS[u.revenueBand as RevenueBand] ?? u.revenueBand}
                      {u.revenueVerified ? (
                        <span className="ml-1 text-green">✓ verified</span>
                      ) : (
                        <span className="ml-1">(self-reported)</span>
                      )}
                      {" · "}
                      Bid {formatMoney(u.currentBid)}
                    </p>
                  </div>
                  <p className="font-mono-label text-[22px] font-semibold text-accent">{u.sacrificeScore.toFixed(2)}×</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-[13px] text-muted">
          <Link href="/verify" className="text-accent hover:underline">
            Verify revenue band →
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            Founder Pro for rival alerts →
          </Link>
        </p>
      </div>
    </main>
  );
}
