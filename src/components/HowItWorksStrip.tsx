"use client";

import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Choose your arena",
    body: "Global board or a category room — AI, SaaS, indie, and 19 more.",
  },
  {
    n: "02",
    title: "Set your stake",
    body: "Paste your URL, pick a revenue band, pay to rank. Real bids only.",
  },
  {
    n: "03",
    title: "Defend the crown",
    body: "Track rivals, call breakouts, climb Underdog Row — reputation is earned.",
  },
];

export function HowItWorksStrip() {
  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="bracket-card !p-4 text-left">
            <span className="font-mono-label text-[11px] font-semibold tracking-[0.2em] text-accent/80">{s.n}</span>
            <p className="mt-2 text-[13px] font-semibold text-foreground">{s.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-muted">
        New here?{" "}
        <Link href="/founders" className="font-medium text-accent hover:underline">
          Open Founder Hub
        </Link>{" "}
        for Discovery bets, room requests, and keeper levels.
      </p>
    </div>
  );
}
