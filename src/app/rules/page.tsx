import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { BRAND_LABEL, CONTACT_EMAIL, SITE_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Rules" };

const SECTIONS = [
  {
    title: "How ranking works",
    rules: [
      "Bids are whole US dollars.",
      "Paying less than #1 still puts you on the board at whatever rank that bid can take.",
      "Enter the same website or @handle again to raise that listing. You only pay the difference from the current bid. Someone else cannot take your rank by paying that difference.",
      "To take the #1 spot you must pay at least $5 more than the current top bid.",
      "Equal bids: the older bid keeps the higher rank.",
      "App Store, Play Store, GitHub, and similar platform links are keyed by their path, so different apps don't share a bid. Tracking query strings are ignored.",
    ],
  },
  {
    title: "What you can list",
    rules: [
      "A product website, or an X @handle.",
      "Chat and invite links are not allowed — Telegram, WhatsApp, Discord, Messenger, Signal, and similar. The board is for products and profiles, not group chats.",
      "Query parameters are stripped from listing links. Affiliate, referral, and tracking URLs will not work.",
    ],
  },
  {
    title: "After you pay",
    rules: [
      "Your listing is public. Clicks go to the URL or profile you submitted, without query parameters.",
      "A completed payment is what claims the rank.",
    ],
  },
  {
    title: "Takeover",
    rules: [
      "Pay 5× the current top bid to lock #1 for 3 consecutive hours on the global board.",
      "While a takeover is active, nobody can displace you from #1 — no matter how much they bid.",
      "When it expires, normal bid ranking resumes instantly.",
    ],
  },
  {
    title: "Payment & chargebacks",
    rules: [
      `By completing a purchase on ${SITE_NAME}, you confirm that you have reviewed the product and pricing and authorize the payment.`,
      "contact_before_chargeback",
      "Nothing in this policy limits any rights that cannot legally be excluded.",
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Rules</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {BRAND_LABEL} is a public leaderboard. You pay to stand above everyone else. Rank is the
          bid — nothing else.
        </p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-accent">{section.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                    <span className="mt-0.5 shrink-0 text-accent">→</span>
                    {rule === "contact_before_chargeback" ? (
                      <span>
                        If you have any issue with your purchase, please contact us at{" "}
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="text-accent underline underline-offset-2"
                        >
                          {CONTACT_EMAIL}
                        </a>{" "}
                        before initiating a payment dispute or chargeback.
                      </span>
                    ) : (
                      rule
                    )}
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
            className="mt-3 inline-block rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition-all hover:brightness-110"
          >
            Go to the leaderboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
