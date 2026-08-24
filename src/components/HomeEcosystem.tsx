"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";
import { RelativeTime } from "@/components/RelativeTime";
import { HomeLiveBattleStarter } from "@/components/HomeLiveBattleStarter";
import { RowOfKings } from "@/components/RowOfKings";
import { PAGE_WIDE } from "@/lib/layout";

interface EcosystemData {
  globalKing: {
    slug: string;
    displayUrl: string;
    title: string;
    currentBid: number;
    clickCount: number;
    reignLabel: string | null;
    gapCents: number | null;
    gapLabel: string | null;
  } | null;
  challenger: { displayUrl: string; currentBid: number; slug: string } | null;
  breakout: { displayUrl: string; growthPct24h: number; slug: string }[];
  underdogs: {
    displayUrl: string;
    sacrificeScore: number;
    currentBid: number;
    revenueBand: string;
    slug: string;
  }[];
  momentum: {
    displayUrl: string;
    growthPct10h: number;
    slug: string;
    bidStart10h: number;
    bidEnd10h: number;
  }[];
  featuredRooms: {
    slug: string;
    label: string;
    icon: string;
    name: string;
    roomLabel: string;
    listingCount: number;
  }[];
  totalRooms: number;
  liveBattles: {
    id: string;
    king: { slug: string; displayUrl: string; currentBid: number };
    challenger: { slug: string; displayUrl: string; currentBid: number };
    gapCents: number;
    votes: number;
    url: string;
  }[];
  kingmakers: {
    userId: string;
    handle: string;
    score: number;
    pickCount: number;
    profileUrl: string;
  }[];
  fallenFund: {
    poolCents: number;
    pct: number;
    status: string;
    grants: { displayUrl: string; slug: string; grantType: string }[];
  };
  history: { id: string; icon: string; headline: string; at: string }[];
  minBid?: number;
}

function SectionBlock({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="kb-eyebrow">{eyebrow}</p>
        <h2 className="font-display mt-1.5 text-[26px] font-semibold leading-tight text-foreground sm:text-[28px]">
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="text-[13px] font-semibold text-accent hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function ListingLink({ slug, displayUrl, className = "" }: { slug: string; displayUrl: string; className?: string }) {
  return (
    <Link href={`/l/${slug}`} className={`font-medium hover:text-accent hover:underline ${className}`}>
      {displayUrl}
    </Link>
  );
}

function BracketCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bracket-card ${className}`}>{children}</div>;
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-muted">{children}</p>;
}

export function HomeEcosystem({ onEnterRoom }: { onEnterRoom: (slug: string) => void }) {
  const { data } = useSWR<EcosystemData>("/api/home-ecosystem", fetcher, { refreshInterval: 20_000 });

  if (!data) {
    return (
      <div className={`${PAGE_WIDE} space-y-5 pb-10`}>
        <div className="h-40 animate-pulse rounded-[18px] bg-surface-2" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[14px] bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${PAGE_WIDE} pb-14`}>
      {/* GLOBAL KING */}
      <section id="global-king" className="eco-section mb-8">
        <div className="king-hero-card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative z-[1] min-w-0">
            <p className="font-mono-label text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent">
              👑 Global King
            </p>
            {data.globalKing ? (
              <>
                <ListingLink
                  slug={data.globalKing.slug}
                  displayUrl={data.globalKing.displayUrl}
                  className="font-display mt-2 block truncate text-[30px] font-semibold text-[#f7f1e6] sm:text-[34px]"
                />
                <p className="mt-1 text-[13.5px] text-[#b9af9c]">
                  Global board
                  {data.globalKing.reignLabel ? ` · ${data.globalKing.reignLabel}` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="font-display mt-2 text-[30px] font-semibold sm:text-[34px]">Throne empty</p>
                <p className="mt-1 text-[13.5px] text-[#b9af9c]">Founding #1 is open — first real bid takes the crown.</p>
              </>
            )}
          </div>
          <div className="relative z-[1] flex flex-wrap gap-6 sm:gap-8">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#b9af9c]">Current bid</p>
              <p className="font-mono-label mt-1 text-[22px] font-semibold text-accent sm:text-[24px]">
                {data.globalKing ? formatMoney(data.globalKing.currentBid) : formatMoney(data.minBid ?? 1)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#b9af9c]">Clicks</p>
              <p className="font-mono-label mt-1 text-[22px] font-semibold text-[#f7f1e6] sm:text-[24px]">
                {data.globalKing?.clickCount ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#b9af9c]">Challenger gap</p>
              <p className="font-mono-label mt-1 text-[22px] font-semibold text-accent sm:text-[24px]">
                {data.globalKing?.gapCents != null ? formatMoney(data.globalKing.gapCents) : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROW OF KINGS */}
      <section className="mb-10" id="row-of-kings">
        <SectionBlock
          eyebrow="Five crowns"
          title="Row of Kings"
          href="/underdogs"
          linkLabel="Underdog Row"
        />
        <RowOfKings />
      </section>

      {/* BREAKOUT · UNDERDOGS · MOMENTUM */}
      <section className="mb-10 grid gap-4 md:grid-cols-3" id="underdogs">
        <BracketCard>
          <p className="mb-2 text-[20px]" aria-hidden>
            🚀
          </p>
          <p className="font-display text-[17px] font-semibold">Breakout</p>
          <p className="mb-3.5 text-[12px] text-muted">Fastest rising, last 24h</p>
          {data.breakout.length === 0 ? (
            <EmptyCard>0 breakouts yet — bid velocity drives this.</EmptyCard>
          ) : (
            data.breakout.slice(0, 3).map((b) => (
              <div key={b.slug} className="mini-row">
                <ListingLink slug={b.slug} displayUrl={b.displayUrl} className="truncate" />
                <span className="font-mono-label shrink-0 font-semibold text-green">+{b.growthPct24h}%</span>
              </div>
            ))
          )}
        </BracketCard>

        <BracketCard>
          <p className="mb-2 text-[20px]" aria-hidden>
            🐕
          </p>
          <p className="font-display text-[17px] font-semibold">Underdogs</p>
          <p className="mb-3.5 text-[12px] text-muted">Biggest conviction — sacrifice score</p>
          {data.underdogs.length === 0 ? (
            <EmptyCard>Pick a revenue band on claim to rank conviction.</EmptyCard>
          ) : (
            data.underdogs.slice(0, 3).map((u) => (
              <div key={u.slug} className="mini-row">
                <ListingLink slug={u.slug} displayUrl={u.displayUrl} className="truncate" />
                <span className="font-mono-label shrink-0 font-semibold text-accent">
                  {u.sacrificeScore.toFixed(1)}×
                </span>
              </div>
            ))
          )}
        </BracketCard>

        <BracketCard>
          <p className="mb-2 text-[20px]" aria-hidden>
            🔥
          </p>
          <p className="font-display text-[17px] font-semibold">Momentum</p>
          <p className="mb-3.5 text-[12px] text-muted">Bid growth, last 10h</p>
          {data.momentum.length === 0 ? (
            <EmptyCard>0 movers yet — momentum updates on bid activity.</EmptyCard>
          ) : (
            data.momentum.slice(0, 3).map((m) => (
              <div key={m.slug} className="mini-row">
                <ListingLink slug={m.slug} displayUrl={m.displayUrl} className="truncate" />
                <span className="font-mono-label shrink-0 font-semibold text-foreground">
                  {formatMoney(m.bidStart10h)}→{formatMoney(m.bidEnd10h)}
                </span>
              </div>
            ))
          )}
        </BracketCard>
      </section>

      {/* ROOMS */}
      <section id="rooms" className="mb-10">
        <SectionBlock
          eyebrow="Category Rooms"
          title="Private squares. Invite to enter."
          href="/rooms"
          linkLabel={`View all ${data.totalRooms}`}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.featuredRooms.map((room) => (
            <BracketCard key={room.slug} className="relative !pb-5">
              <span className="absolute right-5 top-5 rounded-xl border border-border px-2.5 py-1 text-[10.5px] tracking-wide text-muted">
                OPEN
              </span>
              <div className="room-icon-box">{room.icon}</div>
              <p className="font-display text-[17px] font-semibold">{room.label}</p>
              <p className="mt-0.5 text-[12.5px] text-accent">{room.roomLabel}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5 text-[12.5px] text-muted">
                <span>
                  {room.listingCount} founder{room.listingCount === 1 ? "" : "s"}
                </span>
                <button type="button" onClick={() => onEnterRoom(room.slug)} className="enter-btn">
                  Enter →
                </button>
              </div>
            </BracketCard>
          ))}
        </div>
      </section>

      {/* LIVE BATTLES */}
      <section className="mb-10" id="live-battles">
        <SectionBlock eyebrow="⚔️ Right now" title="Live Battles" />
        {data.liveBattles.length === 0 ? (
          <BracketCard className="!p-6">
            <EmptyCard>No active matchups yet — start one below from the live board.</EmptyCard>
            <div className="mt-4">
              <HomeLiveBattleStarter />
            </div>
          </BracketCard>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.liveBattles.map((m) => (
                <Link key={m.id} href={m.url} className="block">
                  <BracketCard className="flex items-center justify-between gap-3 !py-5">
                    <div className="min-w-0 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-accent">Current King</p>
                      <p className="font-display mt-1.5 truncate text-[17px] font-semibold">{m.king.displayUrl}</p>
                      <p className="font-mono-label mt-1 text-[13px] text-muted">{formatMoney(m.king.currentBid)}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="font-mono-label text-[12px] text-accent">VS</p>
                      <p className="font-mono-label mt-1 text-[14px] font-bold text-accent">
                        {formatMoney(m.gapCents)}
                      </p>
                      <p className="text-[10px] text-muted">gap</p>
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted">Challenger</p>
                      <p className="font-display mt-1.5 truncate text-[17px] font-semibold">{m.challenger.displayUrl}</p>
                      <p className="font-mono-label mt-1 text-[13px] text-muted">
                        {formatMoney(m.challenger.currentBid)}
                      </p>
                    </div>
                  </BracketCard>
                </Link>
              ))}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-[13px] font-medium text-accent hover:underline">
                Start another battle
              </summary>
              <div className="mt-3 rounded-[14px] border border-border bg-surface p-4">
                <HomeLiveBattleStarter compact />
              </div>
            </details>
          </>
        )}
      </section>

      {/* KINGMAKERS */}
      <section className="mb-10" id="kingmakers">
        <SectionBlock
          eyebrow="👑 Discovery"
          title="Kingmakers"
          href="/founders"
          linkLabel="See leaderboard"
        />
        <BracketCard className="!py-2">
          {data.kingmakers.length === 0 ? (
            <p className="px-1 py-4 text-[13px] text-muted">No kingmaker scores yet — add discovery picks in Founder Hub.</p>
          ) : (
            data.kingmakers.slice(0, 5).map((k, i) => (
              <div key={k.userId} className="km-row px-1">
                <span className="font-mono-label text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <Link href={k.profileUrl} className="font-semibold hover:text-accent hover:underline">
                    @{k.handle}
                  </Link>
                  <p className="text-[11.5px] text-muted">
                    {k.pickCount} product{k.pickCount === 1 ? "" : "s"} on discovery list
                  </p>
                </div>
                <span className="km-role text-[11.5px] text-muted">Kingmaker</span>
                <span className="font-mono-label text-right font-semibold text-accent">
                  {k.score.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </BracketCard>
      </section>

      {/* FALLEN FUND */}
      <section className="mb-10">
        <SectionBlock eyebrow="🪦 Community" title="Fallen Fund" href="/fallen-fund" linkLabel="How it works" />
        <div className="fallen-fund-card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="kb-eyebrow !text-accent">This week</p>
            <h3 className="font-display mt-1.5 text-[22px] font-semibold leading-snug">
              Underdogs get discovered, on the house
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Funded from {data.fallenFund.pct}% of KingBid revenue — grants publish weekly from community nominations.
              Status: {data.fallenFund.status}.
            </p>
            {data.fallenFund.grants.length > 0 && (
              <ul className="mt-3 space-y-1 text-[13px]">
                {data.fallenFund.grants.map((g, i) => (
                  <li key={`${g.slug}-${i}`}>
                    <ListingLink slug={g.slug} displayUrl={g.displayUrl} />{" "}
                    <span className="text-muted">· {g.grantType.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">This week&apos;s pool</p>
            <p className="font-mono-label mt-1 text-[30px] font-semibold text-accent">
              {formatMoney(Math.round(data.fallenFund.poolCents / 100))}
            </p>
            <p className="mt-1 text-[11px] text-muted">Live accrual from platform revenue</p>
          </div>
        </div>
      </section>

      {/* RECENT HISTORY */}
      <section id="history">
        <SectionBlock eyebrow="📜 The record" title="Recent History" />
        <BracketCard className="!p-0 !py-1">
          {data.history.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-muted">History starts with the first crown change.</p>
          ) : (
            data.history.map((e) => (
              <div key={e.id} className="history-row">
                <span className="text-[16px]" aria-hidden>
                  {e.icon}
                </span>
                <span className="flex-1 text-foreground/90">{e.headline}</span>
                <RelativeTime date={e.at} className="font-mono-label shrink-0 text-[11.5px] text-muted" />
              </div>
            ))
          )}
        </BracketCard>
      </section>
    </div>
  );
}
