"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";
import { RelativeTime } from "@/components/RelativeTime";
import { PAGE } from "@/lib/layout";

interface EcosystemData {
  globalKing: {
    slug: string;
    displayUrl: string;
    title: string;
    currentBid: number;
    gapLabel: string | null;
  } | null;
  challenger: { displayUrl: string; currentBid: number; slug: string } | null;
  leaderboard: {
    rank: number;
    slug: string;
    displayUrl: string;
    title: string;
    currentBid: number;
    id: string;
  }[];
  breakout: { displayUrl: string; growthPct24h: number; currentBid: number; slug: string; title?: string }[];
  underdogs: {
    displayUrl: string;
    sacrificeScore: number;
    currentBid: number;
    revenueBand: string;
    revenueVerified: boolean;
    slug: string;
  }[];
  momentum: { displayUrl: string; growthPct24h: number; slug: string; currentBid?: number }[];
  featuredRooms: {
    slug: string;
    label: string;
    icon: string;
    name: string;
    listingCount: number;
    enterUrl: string;
  }[];
  liveBattles: {
    id: string;
    listingA: { slug: string; displayUrl: string; currentBid: number };
    listingB: { slug: string; displayUrl: string; currentBid: number };
    votes: number;
    url: string;
  }[];
  kingmakers: {
    userId: string;
    handle: string;
    score: number;
    profileUrl: string;
    picks: { slug: string; displayUrl: string }[];
  }[];
  fallenFund: {
    weekStart: string | null;
    poolCents: number;
    pct: number;
    status: string;
    grants: { displayUrl: string; slug: string; grantType: string }[];
  };
  history: { id: string; eventType: string; headline: string; at: string }[];
}

function SectionHead({
  emoji,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-foreground sm:text-[17px]">
          <span aria-hidden className="text-[18px]">
            {emoji}
          </span>
          {title}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>
      </div>
      {href && linkLabel && (
        <Link href={href} className="text-[12.5px] font-medium text-accent hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
    </span>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-[13px] text-muted">{children}</p>;
}

function MetricCard({
  emoji,
  title,
  subtitle,
  children,
  accent = "default",
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accent?: "default" | "green" | "gold";
}) {
  const ring =
    accent === "green"
      ? "from-green/8 to-transparent"
      : accent === "gold"
        ? "from-accent/10 to-transparent"
        : "from-accent/6 to-transparent";
  return (
    <article className={`eco-card relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring}`} />
      <div className="relative">
        <SectionHead emoji={emoji} title={title} subtitle={subtitle} />
        {children}
      </div>
    </article>
  );
}

function ListingLink({
  slug,
  displayUrl,
  className = "",
}: {
  slug: string;
  displayUrl: string;
  className?: string;
}) {
  return (
    <Link href={`/l/${slug}`} className={`font-medium text-foreground hover:text-accent hover:underline ${className}`}>
      {displayUrl}
    </Link>
  );
}

export function HomeEcosystem({ onEnterRoom }: { onEnterRoom: (slug: string) => void }) {
  const { data } = useSWR<EcosystemData>("/api/home-ecosystem", fetcher, { refreshInterval: 20_000 });

  if (!data) {
    return (
      <div className={`${PAGE} space-y-6 pb-10`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${PAGE} space-y-8 pb-12`}>
      {/* GLOBAL KING */}
      <section id="global-king" className="eco-section">
        <SectionHead emoji="👑" title="GLOBAL KING" subtitle="Live leaderboard." />
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <div className="eco-king-card relative overflow-hidden rounded-2xl border border-border-strong bg-gradient-to-br from-peach via-surface to-surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  <LiveDot />
                  Reigning now
                </div>
                {data.globalKing ? (
                  <>
                    <ListingLink
                      slug={data.globalKing.slug}
                      displayUrl={data.globalKing.displayUrl}
                      className="mt-3 block text-[22px] font-bold sm:text-[26px]"
                    />
                    <p className="mt-1 text-[13px] text-muted">{data.globalKing.title}</p>
                    <p className="mt-3 tabular text-[28px] font-bold text-accent sm:text-[32px]">
                      {formatMoney(data.globalKing.currentBid)}
                    </p>
                    {data.globalKing.gapLabel && (
                      <p className="mt-1 text-[12.5px] text-muted">{data.globalKing.gapLabel}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-[20px] font-bold text-foreground">Throne empty</p>
                    <p className="mt-1 text-[13px] text-muted">Founding #1 is open — first real bid takes the crown.</p>
                  </>
                )}
              </div>
              <span className="text-[42px] opacity-90" aria-hidden>
                👑
              </span>
            </div>
            {data.challenger && (
              <div className="mt-5 rounded-xl border border-border/80 bg-surface/70 px-4 py-3 text-[12.5px]">
                <span className="text-muted">Next challenger · </span>
                <ListingLink slug={data.challenger.slug} displayUrl={data.challenger.displayUrl} />
                <span className="text-muted"> · {formatMoney(data.challenger.currentBid)}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Top ranks</p>
            <ol className="space-y-2">
              {data.leaderboard.length === 0 ? (
                <EmptyLine>No listings yet — scroll up to claim #1.</EmptyLine>
              ) : (
                data.leaderboard.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={`tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                        e.rank === 1
                          ? "bg-accent text-white"
                          : e.rank <= 3
                            ? "bg-accent-soft text-accent"
                            : "bg-surface-2 text-muted"
                      }`}
                    >
                      {e.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ListingLink slug={e.slug} displayUrl={e.displayUrl} className="block truncate text-[13px]" />
                    </div>
                    <span className="tabular shrink-0 text-[13px] font-semibold text-foreground">
                      {formatMoney(e.currentBid)}
                    </span>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* BREAKOUT · UNDERDOGS · MOMENTUM */}
      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard emoji="🚀" title="BREAKOUT" subtitle="Fastest rising." accent="green">
          {data.breakout.length === 0 ? (
            <EmptyLine>0 breakouts in the last 24h — bid velocity drives this.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.breakout.slice(0, 4).map((b) => (
                <li key={b.slug} className="flex items-center justify-between gap-2 text-[13px]">
                  <ListingLink slug={b.slug} displayUrl={b.displayUrl} className="truncate" />
                  <span className="shrink-0 font-semibold text-green">+{b.growthPct24h}%</span>
                </li>
              ))}
            </ul>
          )}
        </MetricCard>

        <MetricCard emoji="🐕" title="UNDERDOGS" subtitle="Biggest conviction." accent="gold">
          {data.underdogs.length === 0 ? (
            <EmptyLine>Pick a revenue band on claim — sacrifice score ranks conviction.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.underdogs.slice(0, 4).map((u) => (
                <li key={u.slug} className="text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <ListingLink slug={u.slug} displayUrl={u.displayUrl} className="truncate" />
                    <span className="shrink-0 tabular text-[11px] font-semibold text-accent">
                      {u.sacrificeScore.toFixed(1)}×
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">
                    {formatMoney(u.currentBid)} ·{" "}
                    {REVENUE_BAND_LABELS[u.revenueBand as RevenueBand] ?? u.revenueBand}
                    {!u.revenueVerified ? " · unverified" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </MetricCard>

        <MetricCard emoji="🔥" title="MOMENTUM" subtitle="Fastest growth.">
          {data.momentum.length === 0 ? (
            <EmptyLine>0 movers yet — momentum updates every few hours.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.momentum.slice(0, 4).map((m) => (
                <li key={m.slug} className="flex items-center justify-between gap-2 text-[13px]">
                  <ListingLink slug={m.slug} displayUrl={m.displayUrl} className="truncate" />
                  <span className="shrink-0 text-muted">+{m.growthPct24h}% / 24h</span>
                </li>
              ))}
            </ul>
          )}
        </MetricCard>
      </section>

      {/* ROOMS */}
      <section id="rooms">
        <SectionHead
          emoji="🏰"
          title="ROOMS"
          subtitle="Category arenas — compete where your product belongs."
          href="/rooms"
          linkLabel="All rooms"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {data.featuredRooms.map((room) => (
            <button
              key={room.slug}
              type="button"
              onClick={() => onEnterRoom(room.slug)}
              className="eco-room-tile group flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-4 text-center transition-all hover:border-accent hover:shadow-[var(--shadow)] active:scale-[0.98]"
            >
              <span className="text-[22px] transition-transform group-hover:scale-110" aria-hidden>
                {room.icon}
              </span>
              <span className="text-[13px] font-bold text-foreground">{room.label}</span>
              <span className="text-[11px] text-muted">{room.listingCount} live</span>
            </button>
          ))}
        </div>
      </section>

      {/* LIVE BATTLES + KINGMAKERS */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="eco-card rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <SectionHead emoji="⚔️" title="LIVE BATTLES" subtitle="Current challenges." />
          {data.liveBattles.length === 0 ? (
            <EmptyLine>No active matchups — founders can start battles from listing pages.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.liveBattles.map((m) => (
                <li key={m.id}>
                  <Link
                    href={m.url}
                    className="block rounded-xl border border-border/80 bg-surface-2/50 px-4 py-3 transition-colors hover:border-accent"
                  >
                    <div className="flex items-center justify-between gap-2 text-[13px] font-medium">
                      <span className="truncate">{m.listingA.displayUrl}</span>
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted">vs</span>
                      <span className="truncate text-right">{m.listingB.displayUrl}</span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted">
                      {m.votes} vote{m.votes === 1 ? "" : "s"} ·{" "}
                      {formatMoney(m.listingA.currentBid)} vs {formatMoney(m.listingB.currentBid)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="eco-card rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <SectionHead
            emoji="👑"
            title="KINGMAKERS"
            subtitle="People predicting and discovering winners."
            href="/founders"
            linkLabel="Founder Hub"
          />
          {data.kingmakers.length === 0 ? (
            <EmptyLine>No kingmaker scores yet — add discovery picks in Founder Hub.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.kingmakers.slice(0, 5).map((k) => (
                <li key={k.userId} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={k.profileUrl} className="text-[13px] font-semibold hover:text-accent hover:underline">
                      @{k.handle}
                    </Link>
                    <span className="tabular text-[12px] font-bold text-accent">{k.score} pts</span>
                  </div>
                  {k.picks.length > 0 && (
                    <p className="mt-1 truncate text-[11.5px] text-muted">
                      Picks: {k.picks.map((p) => p.displayUrl).join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FALLEN FUND + HISTORY */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="eco-card rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <SectionHead
            emoji="🪦"
            title="FALLEN FUND"
            subtitle="This week's community discoveries."
            href="/fallen-fund"
            linkLabel="How it works"
          />
          <div className="rounded-xl bg-surface-2/80 px-4 py-3">
            <p className="tabular text-[22px] font-bold text-foreground">
              {formatMoney(Math.round(data.fallenFund.poolCents / 100))}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {data.fallenFund.pct}% of platform revenue · status: {data.fallenFund.status}
            </p>
          </div>
          {data.fallenFund.grants.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted">Grants publish weekly from community nominations.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {data.fallenFund.grants.map((g, i) => (
                <li key={`${g.slug}-${i}`}>
                  <ListingLink slug={g.slug} displayUrl={g.displayUrl} />{" "}
                  <span className="text-muted">· {g.grantType.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="eco-card rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <SectionHead emoji="📜" title="RECENT HISTORY" subtitle="Dethronements, comebacks, record reigns." />
          {data.history.length === 0 ? (
            <EmptyLine>History starts with the first crown change.</EmptyLine>
          ) : (
            <ul className="max-h-[220px] space-y-0 overflow-y-auto pr-1">
              {data.history.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-3 border-b border-border/60 py-2.5 text-[12.5px] last:border-0"
                >
                  <RelativeTime date={e.at} className="shrink-0 tabular text-[11px] text-muted w-[72px]" />
                  <span className="text-foreground/90">{e.headline}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
