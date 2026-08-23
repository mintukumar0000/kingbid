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
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface/80 px-4 py-4 text-left backdrop-blur-sm transition-colors hover:border-[#f0cfc3]"
          >
            <span className="text-[11px] font-bold tabular tracking-[0.2em] text-accent/70">{s.n}</span>
            <p className="mt-2 text-[13px] font-semibold text-foreground">{s.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-muted">
        New here?{" "}
        <Link href="/founders" className="font-medium text-accent hover:underline">
          Open Founder Hub
        </Link>{" "}
        for Discovery bets, room requests, and keeper levels.
      </p>
    </div>
  );
}
