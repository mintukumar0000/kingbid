"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";

interface HomeSectionsData {
  globalKing: {
    slug: string;
    displayUrl: string;
    title: string;
    currentBid: number;
    gapLabel: string | null;
  } | null;
  challenger: { displayUrl: string; currentBid: number; slug: string } | null;
  breakout: { displayUrl: string; growthPct24h: number; currentBid: number; slug: string }[];
  underdogs: {
    displayUrl: string;
    sacrificeScore: number;
    currentBid: number;
    revenueBand: string;
    revenueVerified: boolean;
    slug: string;
  }[];
  momentum: { displayUrl: string; growthPct24h: number; slug: string }[];
}

function Section({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold tracking-wide text-foreground/80">
        {emoji} {title}
      </h2>
      <div className="mt-3 space-y-2 text-[13px]">{children}</div>
    </section>
  );
}

export function HomeSections() {
  const { data } = useSWR<HomeSectionsData>("/api/home-sections", fetcher, {
    refreshInterval: 30_000,
  });

  if (!data) return null;

  return (
    <div className="mx-auto grid max-w-4xl gap-3 px-4 pb-6 sm:grid-cols-2 sm:px-6">
      <Section emoji="👑" title="Global King">
        {data.globalKing ? (
          <>
            <Link href={`/l/${data.globalKing.slug}`} className="font-medium hover:underline">
              {data.globalKing.displayUrl}
            </Link>
            <span className="text-muted"> · {formatMoney(data.globalKing.currentBid)}</span>
            {data.globalKing.gapLabel && (
              <p className="text-[12px] text-muted">{data.globalKing.gapLabel}</p>
            )}
          </>
        ) : (
          <p className="text-muted">No king yet — founding #1 is open.</p>
        )}
      </Section>

      <Section emoji="🚀" title="Breakout">
        {data.breakout.length === 0 ? (
          <p className="text-muted">0 breakouts in the last 24h.</p>
        ) : (
          data.breakout.slice(0, 3).map((b) => (
            <p key={b.slug}>
              <Link href={`/l/${b.slug}`} className="font-medium hover:underline">
                {b.displayUrl}
              </Link>
              <span className="text-green"> +{b.growthPct24h}%</span>
            </p>
          ))
        )}
      </Section>

      <Section emoji="🐕" title="Underdogs">
        {data.underdogs.length === 0 ? (
          <p className="text-muted">0 sacrifice scores yet — pick a revenue band on claim.</p>
        ) : (
          data.underdogs.slice(0, 3).map((u) => (
            <p key={u.slug}>
              <Link href={`/l/${u.slug}`} className="font-medium hover:underline">
                {u.displayUrl}
              </Link>
              <span className="text-muted">
                {" "}
                · {formatMoney(u.currentBid)} ·{" "}
                {REVENUE_BAND_LABELS[u.revenueBand as RevenueBand] ?? u.revenueBand}
                {!u.revenueVerified ? " (unverified)" : ""}
              </span>
            </p>
          ))
        )}
      </Section>

      <Section emoji="🔥" title="Momentum">
        {data.momentum.length === 0 ? (
          <p className="text-muted">0 movers yet.</p>
        ) : (
          data.momentum.slice(0, 3).map((m) => (
            <p key={m.slug}>
              <Link href={`/l/${m.slug}`} className="font-medium hover:underline">
                {m.displayUrl}
              </Link>
              <span className="text-muted"> · +{m.growthPct24h}% bids (24h)</span>
            </p>
          ))
        )}
      </Section>
    </div>
  );
}
