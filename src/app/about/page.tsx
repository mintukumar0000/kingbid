import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { getAboutPageStats } from "@/lib/about-data";
import {
  BRAND_LABEL,
  CONTACT_EMAIL,
  FOUNDER_BIO,
  FOUNDER_HANDLE,
  FOUNDER_NAME,
  SITE_NAME,
} from "@/lib/brand";
import { formatLaunchDate, formatMoney } from "@/lib/format";
import { PAGE } from "@/lib/layout";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a pay-to-rank public leaderboard. The only ranking factor is your bid — higher bid, higher rank.`,
};

export const dynamic = "force-dynamic";

function StatCard({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow)]">
      <div className="tabular text-[26px] font-bold leading-none tracking-tight sm:text-[28px]">
        {children}
      </div>
      <p className="mt-2 text-[12px] text-muted">{label}</p>
    </div>
  );
}

export default async function AboutPage() {
  const stats = await getAboutPageStats();
  const launchLine = formatLaunchDate(stats.launchedAt);
  const hasBoard = stats.totalListings > 0;

  return (
    <main className="flex-1">
      <Header />

      <div className={`${PAGE} flex justify-center pb-16 pt-6`}>
        <article className="w-full max-w-2xl">
          <div className="mb-8 flex justify-center">
            <StatsBar />
          </div>

          <h1 className="text-[32px] font-extrabold tracking-tight text-foreground sm:text-[36px]">
            About
          </h1>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            <span className="text-accent">{SITE_NAME}</span> started as a{" "}
            <span className="text-accent">simple side project</span>: no ads, no algorithm, no
            upvote rings. Just pay to rank — bid globally or on your country board. That&apos;s
            it.
          </p>

          <h2 className="mt-8 text-[15px] font-bold text-foreground">Then it went live</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            The site launched on {launchLine}.
          </p>

          <p className="mt-6 text-[15px] font-medium text-foreground">
            {hasBoard ? "A few things happening since then:" : "The board is open — here's where we are:"}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <StatCard label="visitors">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green" aria-hidden />
                {stats.totalVisitors.toLocaleString()}
              </span>
            </StatCard>
            <StatCard label="revenue">
              <span>
                <span className="text-accent">$</span>{" "}
                {stats.totalRevenue.toLocaleString("en-US")}
              </span>
            </StatCard>
            <StatCard
              label={
                hasBoard
                  ? `highest bid · ${stats.topListing!.displayUrl}`
                  : "highest bid (so far)"
              }
            >
              {hasBoard ? (
                <span>
                  <span className="text-accent">$</span>{" "}
                  {stats.topListing!.currentBid.toLocaleString("en-US")}
                </span>
              ) : (
                <Link href="/" className="text-[22px] text-accent hover:underline sm:text-[24px]">
                  Be the first →
                </Link>
              )}
            </StatCard>
          </div>

          <p className="mt-8 text-[15px] leading-relaxed text-muted">
            {hasBoard ? (
              <>
                <span className="font-semibold text-foreground">
                  {stats.totalListings.toLocaleString()} listing{stats.totalListings === 1 ? "" : "s"}
                </span>{" "}
                on the board and{" "}
                <span className="font-semibold text-foreground">
                  {stats.totalBids.toLocaleString()} completed bid{stats.totalBids === 1 ? "" : "s"}
                </span>
                . Every number above is real — unique visitors, completed payments only, live SSE
                updates.{" "}
                <Link href="/stats" className="text-accent underline underline-offset-2">
                  See live stats →
                </Link>
              </>
            ) : (
              <>
                No paid listings yet — which means{" "}
                <Link href="/" className="font-semibold text-accent underline underline-offset-2">
                  #1 is still {formatMoney(5)}
                </Link>
                . All stats on this page are still honest: visitors are real IPs, revenue counts
                completed payments only.{" "}
                <Link href="/stats" className="text-accent underline underline-offset-2">
                  See live stats →
                </Link>
              </>
            )}
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Discovery is usually rented — SEO, ads, launch-day upvotes. {BRAND_LABEL} is the
            opposite. You pay, you rank. The price is public. The ledger is public. Raise anytime
            by entering the same URL — you only pay the difference.
          </p>

          <p className="mt-5 text-[15px] font-semibold leading-relaxed text-foreground">
            The board is here. Same rules. Same idea. Rank is the bid — nothing else.
          </p>

          {/* Kingbid extras — compact, not card-heavy */}
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="text-[15px] font-bold text-foreground">What you get if you bid</h2>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-muted">
              <li>→ A public listing until someone outbids you — dofollow link included.</li>
              <li>→ Click stats, trending slots, and outbid email alerts (optional).</li>
              <li>→ Share cards, listing pages, referral credits, and global or local boards.</li>
            </ul>
            <p className="mt-4 text-[14px] text-muted">
              <Link href="/rules" className="text-accent underline underline-offset-2">
                Read the full rules →
              </Link>
            </p>
          </div>

          {/* Founder */}
          <div className="mt-10 flex gap-4 border-t border-border pt-8">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-bold text-accent"
              aria-hidden
            >
              {FOUNDER_NAME.split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                {FOUNDER_NAME}{" "}
                <span className="font-normal text-muted">
                  —{" "}
                  <a
                    href={`https://x.com/${FOUNDER_HANDLE.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    @{FOUNDER_HANDLE.replace(/^@/, "")}
                  </a>
                </span>
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{FOUNDER_BIO}</p>
              <p className="mt-2 text-[13px] text-muted">
                Questions?{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-accent px-8 py-3 text-[14px] font-semibold text-white transition-all hover:brightness-110"
            >
              Go to the leaderboard →
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
