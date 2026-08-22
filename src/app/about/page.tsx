import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { BRAND_LABEL, CONTACT_EMAIL, SITE_NAME } from "@/lib/brand";
import { PAGE } from "@/lib/layout";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a pay-to-rank public leaderboard. The only ranking factor is your bid — higher bid, higher rank.`,
};

const LIVE_STATS = [
  {
    label: "Online now",
    detail: "Live SSE connections plus recent heartbeats — not a random number.",
  },
  {
    label: "Visitors",
    detail: "Unique IPs that actually loaded the site since launch.",
  },
  {
    label: "Revenue",
    detail: "Sum of completed payments only (Dodo in production). Pending checkouts don't count.",
  },
  {
    label: "Clicks & trending",
    detail: "Real outbound clicks, rate-limited so spam clicking does nothing.",
  },
  {
    label: "Live board",
    detail: "New bids land on every open tab instantly via Server-Sent Events.",
  },
];

const BENEFITS = [
  {
    title: "Public rank",
    body: "A permanent listing on the board until someone outbids you.",
  },
  {
    title: "Dofollow link",
    body: "Clicks go to your site or X profile — query strings stripped, clean URLs.",
  },
  {
    title: "Click stats",
    body: "See how many people visit you. Trending slots reward real traffic.",
  },
  {
    title: "Outbid alerts",
    body: "Leave an email and get notified the moment you lose #1.",
  },
  {
    title: "Global & local",
    body: "Bid worldwide or compete on your country's board — switch anytime.",
  },
  {
    title: "Share & refer",
    body: "OG share cards, listing pages, and $1 referral credit when someone bids via your link.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <Header />

      {/* Hero */}
      <section className={`${PAGE} pt-10 pb-8 text-center sm:pt-14`}>
        <p className="text-[13px] font-semibold uppercase tracking-widest text-accent">About</p>
        <h1 className="mt-3 text-[32px] font-extrabold tracking-tight text-foreground sm:text-[40px]">
          The leaderboard money can buy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
          <span className="font-medium text-foreground">{SITE_NAME}</span> is a public directory
          where anyone can list a product website or an X handle. There is no algorithm. The only
          ranking factor is the amount of money someone paid. Higher bid, higher rank — until someone
          pays more.
        </p>
      </section>

      {/* Why it exists */}
      <section className={`${PAGE} pb-10`}>
        <div className="rounded-[20px] border border-[#f0cfc3] bg-peach p-6 sm:p-8">
          <h2 className="text-lg font-bold text-foreground">Why it exists</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Discovery is usually rented: ads, SEO, newsletters, launch sites with upvote rings.
            {BRAND_LABEL} is the opposite. You pay, you rank. The price is public. The ledger is
            public. If you want the traffic, you buy the spot in the open.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-foreground shadow-sm">
              No algorithm
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-foreground shadow-sm">
              Public bids
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-foreground shadow-sm">
              Instant rank
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-foreground shadow-sm">
              Global + local boards
            </span>
          </div>
        </div>
      </section>

      {/* What is live */}
      <section className={`${PAGE} pb-10`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">What is live (not fake)</h2>
            <p className="mt-1 text-[14px] text-muted">
              Every number on the homepage is backed by real data.
            </p>
          </div>
          <Link
            href="/stats"
            className="text-[13px] font-semibold text-accent hover:underline underline-offset-2"
          >
            See live stats →
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {LIVE_STATS.map((item) => (
            <li
              key={item.label}
              className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow)]"
            >
              <p className="text-[13px] font-semibold text-accent">{item.label}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* What you get */}
      <section className={`${PAGE} pb-10`}>
        <h2 className="text-lg font-bold text-foreground">What you get if you bid</h2>
        <p className="mt-1 text-[14px] text-muted">
          One payment. One spot. Everything below included.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)]"
            >
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links + CTA */}
      <section className={`${PAGE} pb-16`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/rules"
            className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition-colors hover:border-accent"
          >
            <p className="font-semibold text-foreground group-hover:text-accent">Read the rules</p>
            <p className="mt-1 text-[13px] text-muted">
              Ranking, raises, takeovers, and what you can list.
            </p>
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition-colors hover:border-accent"
          >
            <p className="font-semibold text-foreground group-hover:text-accent">Get in touch</p>
            <p className="mt-1 text-[13px] text-muted">{CONTACT_EMAIL}</p>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow)]">
          <p className="text-lg font-bold text-foreground">Ready to claim a rank?</p>
          <p className="mt-2 text-[14px] text-muted">
            New listings start at $5. The board won&apos;t stay empty forever.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-accent px-8 py-3 text-[14px] font-semibold text-white transition-all hover:brightness-110"
          >
            Go to the leaderboard →
          </Link>
        </div>
      </section>
    </main>
  );
}
