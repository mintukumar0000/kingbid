"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

const KEEPER_RULES = [
  { level: "Member", rule: "Add 1 product to your Discovery list (/founders)" },
  { level: "Scout", rule: "3 Discovery list picks — nominate products you believe in" },
  { level: "Keeper", rule: "Curate 1 approved room + Kingbid Score ≥ 20" },
  { level: "Senior Keeper", rule: "3 active rooms + Score ≥ 50 — pin listings, run events" },
  { level: "Legendary Keeper", rule: "5 rooms + Score ≥ 100 — propose homepage spotlights" },
];

export default function FoundersPage() {
  const { data: me, mutate } = useSWR("/api/me", fetcher);
  const { data: discovery, mutate: mutateDiscovery } = useSWR("/api/discovery-list", fetcher);
  const { data: rivals, mutate: mutateRivals } = useSWR("/api/rivals", fetcher);

  const [betSlug, setBetSlug] = useState("");
  const [rivalYours, setRivalYours] = useState("");
  const [rivalTheirs, setRivalTheirs] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function addBet(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/discovery-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug: betSlug.trim() }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Added to your 10 bets." : d.error);
    if (res.ok) {
      setBetSlug("");
      mutateDiscovery();
      mutate();
    }
  }

  async function addRival(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/rivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug: rivalYours.trim(), rivalSlug: rivalTheirs.trim() }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Rival tracked." : d.error);
    if (res.ok) {
      setRivalYours("");
      setRivalTheirs("");
      mutateRivals();
    }
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent";

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-3xl px-4 py-10 sm:px-6`}>
        <h1 className="text-2xl font-bold tracking-tight">Founder Hub</h1>
        <p className="mt-2 text-[15px] text-muted">
          Everything v2 lives here — rooms, keepers, kingmaker bets, rivals, and tools for your listing.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Kingbid Score" value={me?.kingbidScore ?? 0} />
          <Stat label="Discovery bets" value={`${me?.discoveryBets ?? 0}/10`} />
          <Stat label="Pro tier" value={me?.subscription?.tier ?? "Free"} />
        </div>

        {me?.pendingRoomRequest && (
          <p className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-[13px]">
            Room request pending admin review: <strong>{me.pendingRoomRequest.name}</strong> (
            {me.pendingRoomRequest.slug})
          </p>
        )}

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Quick paths</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PathCard href="/rooms/request" title="Request a new room" desc="Geo, niche, or founder-type board. Gated by score or admin approval." />
            <PathCard href="/rooms" title="Browse all rooms" desc="22 category rooms + community rooms. Enter to bid." />
            <PathCard href="/pricing" title="Founder Pro / Room Pro" desc="Analytics & rival alerts via Dodo — never buys rank." />
            <PathCard href="/fallen-fund" title="Fallen Fund recap" desc="Visibility grants for dethroned underdogs — never cash." />
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold">Kingmaker — Discovery list (10 bets)</h2>
          <p className="mt-1 text-[13px] text-muted">
            Pick founders you believe will hit #1. When you&apos;re right, your Kingbid Score rises. No money involved.
          </p>
          <form onSubmit={addBet} className="mt-4 flex flex-wrap gap-2">
            <input
              className={`${field} min-w-[200px] flex-1`}
              placeholder="listing slug e.g. writenaturallyai"
              value={betSlug}
              onChange={(e) => setBetSlug(e.target.value)}
            />
            <button type="submit" className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white">
              Add bet
            </button>
          </form>
          {discovery?.bets?.length > 0 && (
            <ul className="mt-4 space-y-1 text-[13px]">
              {discovery.bets.map((b: { slug: string; displayUrl: string }) => (
                <li key={b.slug}>
                  <Link href={`/l/${b.slug}`} className="hover:underline">
                    {b.displayUrl}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[12px] text-muted">{discovery?.remaining ?? 10} slots left</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold">Rivals dashboard</h2>
          <p className="mt-1 text-[13px] text-muted">
            Track competitors — get game-style alerts when they close the gap (daily cron).
          </p>
          <form onSubmit={addRival} className="mt-4 grid gap-2 sm:grid-cols-2">
            <input className={field} placeholder="Your listing slug" value={rivalYours} onChange={(e) => setRivalYours(e.target.value)} />
            <input className={field} placeholder="Rival listing slug" value={rivalTheirs} onChange={(e) => setRivalTheirs(e.target.value)} />
            <button type="submit" className="sm:col-span-2 rounded-full border border-border px-4 py-2 text-[13px] font-semibold hover:border-accent">
              Track rival
            </button>
          </form>
          {rivals?.rivals?.length > 0 && (
            <ul className="mt-4 space-y-2 text-[13px]">
              {rivals.rivals.map((r: { id: string; yours: { displayUrl: string }; rival: { displayUrl: string }; gapLabel: string }) => (
                <li key={r.id} className="rounded-lg bg-surface-2 px-3 py-2">
                  {r.yours.displayUrl} vs {r.rival.displayUrl} — {r.gapLabel}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold">Room Keeper levels (earned, not bought)</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {KEEPER_RULES.map((r) => (
              <li key={r.level}>
                <strong>{r.level}</strong> — {r.rule}
              </li>
            ))}
          </ul>
          {me?.keeperLevels?.length > 0 && (
            <p className="mt-4 text-[13px] text-muted">
              Your levels:{" "}
              {me.keeperLevels.map((k: { room: string; level: string }) => `${k.room} (${k.level})`).join(", ")}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold">Your listing tools</h2>
          <p className="mt-1 text-[13px] text-muted">
            After you&apos;re on the board, open your listing page for revenue band, migration badge, Call It, and embed badge.
          </p>
          <p className="mt-3 text-[13px]">
            Example: <Link href="/l/yoursite" className="text-accent hover:underline">/l/your-slug</Link> — replace with your actual slug from the leaderboard.
          </p>
        </section>

        {msg && <p className="mt-4 text-[13px] text-muted">{msg}</p>}

        {me?.userId && (
          <p className="mt-8 text-[12px] text-muted">
            <Link href={`/profile/${me.userId}`} className="text-accent hover:underline">
              View your Kingmaker profile →
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular">{value}</p>
    </div>
  );
}

function PathCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-surface p-4 hover:border-accent transition-colors">
      <p className="font-semibold text-[14px]">{title}</p>
      <p className="mt-1 text-[12px] text-muted">{desc}</p>
    </Link>
  );
}
