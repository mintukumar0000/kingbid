import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Rules" };

const SECTIONS = [
  {
    title: "How ranking works",
    rules: [
      "The only ranking factor is the amount you bid. Higher bid = higher rank. That's it.",
      "New listings start at $5 minimum. Whole US dollars only, in $1 increments, up to a maximum of $999,999.",
      "To take the #1 spot you must pay at least $5 more than the current top bid.",
      "Paying less than the #1 price still puts you on the board — at whatever place that bid can take.",
      "Equal bids: the older bid keeps the higher rank. First come, first served.",
      "A completed payment is what claims the rank. Intent doesn't count — money does.",
    ],
  },
  {
    title: "Raising your bid",
    rules: [
      "Already on the board? Enter the same URL or @handle and you only pay the DIFFERENCE between your current total and your new total.",
      "Every raise must be at least $1 above your current bid.",
      "Example: you're at #3 with $500 and #1 sits at $800. Reclaiming #1 costs you $305 ($800 + $5 − $500).",
    ],
  },
  {
    title: "Takeover",
    rules: [
      "Pay 5x the current top bid to lock the #1 position for 3 consecutive hours.",
      "While a takeover is active, nobody can displace you from #1 — no matter how much they bid.",
      "Only one takeover can be active at a time. When it expires, normal bid ranking resumes instantly.",
    ],
  },
  {
    title: "What you can list",
    rules: [
      "Allowed: product websites and X/Twitter @handles.",
      "Not allowed: chat or invite links — Telegram, WhatsApp, Discord, Messenger, Signal.",
      "Not allowed: sexual, NSFW, or adult content of any kind.",
      "Query parameters are stripped from all URLs. No tracking or affiliate links.",
      "Link shorteners are automatically expanded to their final destination and cleaned.",
      "App Store, Play Store, and GitHub links are keyed by their full path — different apps never share a bid.",
    ],
  },
  {
    title: "The fine print",
    rules: [
      "All payments are final. There are no refunds — being outbid is the whole game.",
      "Bids are for placement only. We don't endorse any listed product.",
      "Clicks are rate-limited per visitor to keep the trending stats honest.",
      "We reserve the right to remove listings that break these rules, without refund.",
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">The rules</h1>
        <p className="mt-2 text-muted">Simple game. Money talks.</p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-accent">{section.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                    <span className="text-accent mt-0.5 shrink-0">→</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="font-semibold">Ready to claim your spot?</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-accent px-6 py-2.5 font-semibold text-white hover:brightness-110 transition-all"
          >
            Go to the leaderboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
