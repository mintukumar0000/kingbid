"use client";

import Link from "next/link";

const STEPS = [
  { n: "1", label: "Pick a room", href: "/rooms" },
  { n: "2", label: "Paste URL & pay", href: "/#claim" },
  { n: "3", label: "Climb ranks", href: "/founders" },
];

export function HowItWorksStrip() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[13px] sm:gap-3">
      {STEPS.map((s, i) => (
        <span key={s.n} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted/50">→</span>}
          <Link
            href={s.href}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 shadow-sm transition-colors hover:border-accent"
          >
            <span className="font-mono-label text-[11px] font-semibold text-accent">{s.n}</span>
            <span className="font-medium text-foreground">{s.label}</span>
          </Link>
        </span>
      ))}
      <span className="hidden text-muted sm:inline">·</span>
      <Link href="/founders" className="text-[12px] font-medium text-accent hover:underline">
        Founder Hub
      </Link>
    </div>
  );
}
