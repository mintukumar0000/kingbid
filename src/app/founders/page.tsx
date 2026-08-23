"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { Header } from "@/components/Header";
import { DemoPreview, FOUNDER_FEATURE_DEMOS } from "@/components/FounderHubDemo";
import { PAGE } from "@/lib/layout";
import type { LeaderboardData } from "@/lib/leaderboard";

const KEEPER_RULES = [
  { level: "Member", rule: "Add 1 product to your Discovery list" },
  { level: "Scout", rule: "3 Discovery list picks — nominate products you believe in" },
  { level: "Keeper", rule: "Curate 1 approved room + Kingbid Score ≥ 20" },
  { level: "Senior Keeper", rule: "3 active rooms + Score ≥ 50 — pin listings, run events" },
  { level: "Legendary Keeper", rule: "5 rooms + Score ≥ 100 — propose homepage spotlights" },
];

type Msg = { type: "ok" | "err"; text: string } | null;

export default function FoundersPage() {
  const { data: me, mutate } = useSWR("/api/me", fetcher);
  const { data: discovery, mutate: mutateDiscovery } = useSWR("/api/discovery-list", fetcher);
  const { data: rivals, mutate: mutateRivals } = useSWR("/api/rivals", fetcher);
  const { data: board } = useSWR<LeaderboardData>("/api/listings?limit=30", fetcher);
  const { data: categoriesData } = useSWR<{ categories: { slug: string; name: string; boardId: string | null }[] }>(
    "/api/categories",
    fetcher
  );

  const [betSlug, setBetSlug] = useState("");
  const [rivalYours, setRivalYours] = useState("");
  const [rivalTheirs, setRivalTheirs] = useState("");
  const [callBoardId, setCallBoardId] = useState("");
  const [callListingSlug, setCallListingSlug] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const listings = board?.entries ?? [];
  const rooms = (categoriesData?.categories ?? []).filter((c) => c.boardId);

  useEffect(() => {
    if (listings.length && !betSlug) setBetSlug(listings[0]!.slug);
  }, [listings, betSlug]);

  useEffect(() => {
    if (rooms.length && !callBoardId) setCallBoardId(rooms[0]!.boardId!);
  }, [rooms, callBoardId]);

  async function addBet(e: React.FormEvent) {
    e.preventDefault();
    setLoading("bet");
    setMsg(null);
    const res = await fetch("/api/discovery-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listingSlug: betSlug.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: `Added ${betSlug} to your discovery list.` });
      setBetSlug("");
      mutateDiscovery();
      mutate();
    } else {
      setMsg({ type: "err", text: d.error ?? "Could not add bet." });
    }
    setLoading(null);
  }

  async function addRival(e: React.FormEvent) {
    e.preventDefault();
    setLoading("rival");
    setMsg(null);
    const res = await fetch("/api/rivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listingSlug: rivalYours.trim(), rivalSlug: rivalTheirs.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: "Rival tracked — alerts run on the daily cron." });
      setRivalYours("");
      setRivalTheirs("");
      mutateRivals();
    } else {
      setMsg({ type: "err", text: d.error ?? "Could not track rival." });
    }
    setLoading(null);
  }

  async function submitCallIt(e: React.FormEvent) {
    e.preventDefault();
    if (!callBoardId || !callListingSlug.trim()) {
      setMsg({ type: "err", text: "Pick a room board and listing for Call It." });
      return;
    }
    setLoading("call");
    setMsg(null);
    const listing = listings.find((l) => l.slug === callListingSlug.trim());
    if (!listing) {
      setMsg({ type: "err", text: "Listing not on the board — pick from the dropdown." });
      setLoading(null);
      return;
    }
    const res = await fetch(`/api/boards/${callBoardId}/call-it`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ predictedListingId: listing.id }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: "Call It locked for tonight — free, no payment screen." });
    } else {
      setMsg({ type: "err", text: d.error ?? "Call It failed." });
    }
    setLoading(null);
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent";

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-3xl py-10`}>
        <p className="kb-eyebrow">Founder tools</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold tracking-tight">Founder Hub</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Reputation features live here — discovery bets, rivals, Call It, keeper levels, and Pro tools.
          Rank is always pay-to-rank on the board; nothing here buys placement.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Kingbid Score" value={me?.kingbidScore ?? 0} />
          <Stat label="Discovery bets" value={`${me?.discoveryBets ?? 0}/10`} />
          <Stat label="Pro tier" value={me?.subscription?.tier ?? "Free"} />
        </div>

        {listings.length === 0 && (
          <div className="mt-6 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-[13px]">
            <strong>No listings on the board yet.</strong>{" "}
            <Link href="/#claim" className="font-medium text-accent hover:underline">
              Claim #1 on the homepage
            </Link>{" "}
            first — then discovery bets and rivals unlock for real slugs.
          </div>
        )}

        {me?.pendingRoomRequest && (
          <p className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-[13px]">
            Room request pending admin review: <strong>{me.pendingRoomRequest.name}</strong> (
            {me.pendingRoomRequest.slug})
          </p>
        )}

        {msg && (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-[13px] ${
              msg.type === "ok" ? "border border-green/30 bg-green/5 text-green" : "border border-red/30 bg-red/5 text-red"
            }`}
          >
            {msg.text}
          </p>
        )}

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-xl font-semibold">Quick paths</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PathCard href="/#claim" title="Claim a spot" desc="Paste your URL on the homepage — pay to rank globally or in a room." />
            <PathCard href="/rooms" title="Browse rooms" desc="22 category rooms. Enter one and bid where your product belongs." />
            <PathCard href="/pricing" title="Founder Pro / Room Pro" desc="Analytics & rival alerts via Dodo — never buys rank." />
            <PathCard href="/verify" title="Verification checklist" desc="Click-through guide to confirm every v2 feature matches spec." />
          </div>
        </section>

        {/* DISCOVERY */}
        <section className="mt-10 bracket-card">
          <h2 className="text-[15px] font-semibold">Kingmaker — Discovery list (10 bets)</h2>
          <p className="mt-1 text-[13px] text-muted">
            Pick founders you believe will hit #1. When you&apos;re right, your Kingbid Score rises. No money involved.
          </p>
          <form onSubmit={addBet} className="mt-4 flex flex-wrap gap-2">
            {listings.length > 0 ? (
              <select
                className={`${field} min-w-[200px] flex-1`}
                value={betSlug}
                onChange={(e) => setBetSlug(e.target.value)}
              >
                <option value="">Select a live listing…</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.slug}>
                    #{l.rank} {l.displayUrl} ({l.slug})
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={`${field} min-w-[200px] flex-1`}
                placeholder="listing slug — claim #1 first if empty"
                value={betSlug}
                onChange={(e) => setBetSlug(e.target.value)}
              />
            )}
            <button
              type="submit"
              disabled={loading === "bet" || !betSlug.trim()}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {loading === "bet" ? "Adding…" : "Add bet"}
            </button>
          </form>
          {discovery?.bets?.length > 0 ? (
            <ul className="mt-4 space-y-1 text-[13px]">
              {discovery.bets.map((b: { slug: string; displayUrl: string; currentBid: number }) => (
                <li key={b.slug} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <Link href={`/l/${b.slug}`} className="font-medium hover:underline">
                    {b.displayUrl}
                  </Link>
                  <span className="text-muted tabular">${b.currentBid}</span>
                </li>
              ))}
            </ul>
          ) : (
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.discovery} />
          )}
          <p className="mt-2 text-[12px] text-muted">{discovery?.remaining ?? 10} slots left</p>
        </section>

        {/* RIVALS */}
        <section className="mt-6 bracket-card">
          <h2 className="text-[15px] font-semibold">Rivals dashboard</h2>
          <p className="mt-1 text-[13px] text-muted">
            Track competitors — get game-style alerts when they close the gap (daily cron).
          </p>
          <form onSubmit={addRival} className="mt-4 grid gap-2 sm:grid-cols-2">
            {listings.length > 0 ? (
              <>
                <select className={field} value={rivalYours} onChange={(e) => setRivalYours(e.target.value)} required>
                  <option value="">Your listing</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.slug}>
                      {l.displayUrl}
                    </option>
                  ))}
                </select>
                <select className={field} value={rivalTheirs} onChange={(e) => setRivalTheirs(e.target.value)} required>
                  <option value="">Rival listing</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.slug}>
                      {l.displayUrl}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <input className={field} placeholder="Your listing slug" value={rivalYours} onChange={(e) => setRivalYours(e.target.value)} />
                <input className={field} placeholder="Rival listing slug" value={rivalTheirs} onChange={(e) => setRivalTheirs(e.target.value)} />
              </>
            )}
            <button
              type="submit"
              disabled={loading === "rival"}
              className="rounded-full border border-border px-4 py-2 text-[13px] font-semibold hover:border-accent disabled:opacity-50 sm:col-span-2"
            >
              {loading === "rival" ? "Saving…" : "Track rival"}
            </button>
          </form>
          {rivals?.rivals?.length > 0 ? (
            <ul className="mt-4 space-y-2 text-[13px]">
              {rivals.rivals.map((r: { id: string; yours: { displayUrl: string }; rival: { displayUrl: string }; gapLabel: string }) => (
                <li key={r.id} className="rounded-lg bg-surface-2 px-3 py-2">
                  <span className="font-medium">
                    {r.yours.displayUrl} vs {r.rival.displayUrl}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">{r.gapLabel}</span>
                </li>
              ))}
            </ul>
          ) : (
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.rivals} />
          )}
        </section>

        {/* CALL IT */}
        <section className="mt-6 bracket-card">
          <h2 className="text-[15px] font-semibold">Call It — free nightly prediction</h2>
          <p className="mt-1 text-[13px] text-muted">
            Predict a room&apos;s #1 at midnight UTC. Correct calls boost Kingmaker score — never opens a payment screen.
          </p>
          <form onSubmit={submitCallIt} className="mt-4 grid gap-2 sm:grid-cols-2">
            <select className={field} value={callBoardId} onChange={(e) => setCallBoardId(e.target.value)} required>
              <option value="">Select room board</option>
              {rooms.map((r) => (
                <option key={r.slug} value={r.boardId!}>
                  {r.name}
                </option>
              ))}
            </select>
            {listings.length > 0 ? (
              <select className={field} value={callListingSlug} onChange={(e) => setCallListingSlug(e.target.value)}>
                <option value="">Pick tonight&apos;s #1 candidate</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.displayUrl}
                  </option>
                ))}
              </select>
            ) : (
              <input className={field} placeholder="Listing slug" value={callListingSlug} onChange={(e) => setCallListingSlug(e.target.value)} />
            )}
            <button
              type="submit"
              disabled={loading === "call"}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 sm:col-span-2"
            >
              {loading === "call" ? "Locking…" : "Call It for tonight"}
            </button>
          </form>
          <DemoPreview {...FOUNDER_FEATURE_DEMOS.callIt} />
        </section>

        {/* KEEPER */}
        <section className="mt-6 bracket-card">
          <h2 className="text-[15px] font-semibold">Room Keeper levels (earned, not bought)</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {KEEPER_RULES.map((r) => (
              <li key={r.level}>
                <strong>{r.level}</strong> — {r.rule}
              </li>
            ))}
          </ul>
          {me?.keeperLevels?.length > 0 ? (
            <p className="mt-4 text-[13px] text-muted">
              Your levels:{" "}
              {me.keeperLevels.map((k: { room: string; level: string }) => `${k.room} (${k.level})`).join(", ")}
            </p>
          ) : (
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.keeper} />
          )}
        </section>

        {/* UNDERDOG + FALLEN FUND previews */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="bracket-card">
            <h2 className="text-[15px] font-semibold">Underdog Row</h2>
            <p className="mt-1 text-[12px] text-muted">Sacrifice score on the homepage — bands only, never exact revenue.</p>
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.underdog} />
            <Link href="/#underdogs" className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline">
              See live Underdogs →
            </Link>
          </div>
          <div className="bracket-card">
            <h2 className="text-[15px] font-semibold">Fallen Fund</h2>
            <p className="mt-1 text-[12px] text-muted">Visibility grants for dethroned underdogs — never cash.</p>
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.fallenFund} />
            <Link href="/fallen-fund" className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline">
              Read how it works →
            </Link>
          </div>
        </section>

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
    <div className="bracket-card !p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono-label mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function PathCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="bracket-card block !p-4 transition-colors hover:border-accent">
      <p className="font-semibold text-[14px]">{title}</p>
      <p className="mt-1 text-[12px] text-muted">{desc}</p>
    </Link>
  );
}
