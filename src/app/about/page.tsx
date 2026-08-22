import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="mt-3 text-muted leading-relaxed">
          kingbid.lol is a public directory where anyone can list a product website or an X handle.
          There is no algorithm. The only ranking factor is the amount of money someone paid.
          Higher bid, higher rank — until someone pays more.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Why it exists</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Discovery is usually rented: ads, SEO, newsletters, launch sites with upvote rings.
          This board is the opposite. You pay, you rank. The price is public. The ledger is public.
          If you want the traffic, you buy the spot in the open.
        </p>

        <h2 className="mt-10 text-lg font-semibold">What is live (not fake)</h2>
        <ul className="mt-3 space-y-2 text-[15px] text-muted">
          <li>→ Online count is people with the page open right now (live SSE connections + recent heartbeats).</li>
          <li>→ Visitors since launch is unique IPs that actually loaded the site.</li>
          <li>→ Revenue is the sum of completed Polar (or mock, locally) payments.</li>
          <li>→ Clicks/hour is real outbound click velocity, rate-limited so spam clicking does nothing.</li>
          <li>→ New bids land on every open tab instantly via Server-Sent Events.</li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">What you get if you bid</h2>
        <ul className="mt-3 space-y-2 text-[15px] text-muted">
          <li>→ A permanent listing until someone outbids you.</li>
          <li>→ A dofollow link to your site (or X profile).</li>
          <li>→ Click stats and a trending slot if people actually visit you.</li>
          <li>→ An email the moment you lose the #1 spot (if you left an address).</li>
        </ul>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow)]">
          <p className="font-semibold">Ready to claim a rank?</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Go to the leaderboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
