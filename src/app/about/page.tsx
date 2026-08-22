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
  FOUNDER_X_URL,
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
      <p className="mt-2 truncate text-[12px] text-muted">{label}</p>
    </div>
  );
}

export default async function AboutPage() {
  const stats = await getAboutPageStats();
  const launchLine = formatLaunchDate(stats.launchedAt);
  const hasBoard = stats.totalListings > 0;
  const handle = FOUNDER_HANDLE.replace(/^@/, "");

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
            {hasBoard ? "A few crazy things that happened since then:" : "A few things worth knowing:"}
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
                  ? `highest bid (so far) · ${stats.topListing!.displayUrl}`
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
                  {stats.totalListings.toLocaleString()} paid listing
                  {stats.totalListings === 1 ? "" : "s"}
                </span>{" "}
                and climbing — every rank earned with real money, not fake rows. Visitors are real
                IPs. Revenue is completed checkout only. No padding, no theatre.{" "}
                <Link href="/stats" className="text-accent underline underline-offset-2">
                  See live stats →
                </Link>
              </>
            ) : (
              <>
                Nobody&apos;s claimed the board yet — which means{" "}
                <Link href="/" className="font-semibold text-accent underline underline-offset-2">
                  #1 is still {formatMoney(5)}
                </Link>
                . That&apos;s the cheapest this spot will ever be. The numbers above aren&apos;t
                dressed up: real visitors, real payments, zero filler. First name on the board wins
                the story.{" "}
                <Link href="/stats" className="text-accent underline underline-offset-2">
                  See live stats →
                </Link>
              </>
            )}
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Most discovery is rented — you pay Google, you pray on Product Hunt, you hire an agency
            and hope someone clicks. {BRAND_LABEL} flips it: you pay once, your bid{" "}
            <span className="font-medium text-foreground">is</span> your rank. Price on the wall.
            Ledger in the open. Same URL to raise — you only cover the gap.
          </p>

          <p className="mt-5 text-[15px] font-semibold leading-relaxed text-foreground">
            The board is here. Same rules. Same idea. Rank is the bid — nothing else.
          </p>

          <div className="mt-10 flex gap-4 border-t border-border pt-8">
            <img
              src={`https://unavatar.io/x/${handle}`}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full bg-surface-2 object-cover"
            />
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                {FOUNDER_NAME}{" "}
                <span className="font-normal text-muted">
                  —{" "}
                  <a
                    href={FOUNDER_X_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    @{handle}
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
        </article>
      </div>
    </main>
  );
}
