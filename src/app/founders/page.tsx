"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { Header } from "@/components/Header";
import { DemoPreview, FOUNDER_FEATURE_DEMOS } from "@/components/FounderHubDemo";
import { PAGE } from "@/lib/layout";
import type { LeaderboardData } from "@/lib/leaderboard";

import { ROOM_SCARCITY_RULES } from "@/lib/keeper-privileges";

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
      <div className={`${PAGE} py-10`}>
        <p className="kb-eyebrow">Founder tools</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold tracking-tight">Founder Hub</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Discovery bets, rivals, Call It, and keeper levels — reputation only, never buys rank.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Score" value={me?.kingbidScore ?? 0} />
          <Stat label="Discovery" value={`${me?.discoveryBets ?? 0}/10`} />
          <Stat
            label="Tier"
            value={me?.subscription?.label ?? me?.subscription?.tier ?? "Free"}
            hint={me?.isPro ? "Pro active on this account" : undefined}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
          <Link href="/#claim" className="text-accent hover:underline">Claim a spot</Link>
          <Link href="/rooms" className="text-accent hover:underline">Rooms</Link>
          <Link href="/pricing" className="text-accent hover:underline">Pro</Link>
          <Link href="/feed" className="text-accent hover:underline">Feed</Link>
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

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* DISCOVERY */}
        <section className="luxury-card p-5">
          <h2 className="font-display text-[16px] font-semibold">Discovery bets</h2>
          <p className="mt-1 text-[12px] text-muted">Pick founders you think hit #1 — raises your score.</p>
          {listings.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-5 text-[13px]">
              <p className="font-medium text-foreground">Board is empty — claim first</p>
              <p className="mt-2 text-muted">
                Discovery bets only work on <strong>live listings</strong> already on the board. You can&apos;t bet on a URL that isn&apos;t listed yet.
              </p>
              <Link
                href="/#claim"
                className="mt-3 inline-block rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white hover:brightness-110"
              >
                Claim #1 on homepage ($5 min)
              </Link>
              <p className="mt-3 text-[12px] text-muted">
                After paying, your listing appears on the board — then come back and pick it (or others) from the dropdown.
              </p>
            </div>
          ) : (
            <form onSubmit={addBet} className="mt-4 flex flex-wrap gap-2">
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
              <button
                type="submit"
                disabled={loading === "bet" || !betSlug.trim()}
                className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {loading === "bet" ? "Adding…" : "Add bet"}
              </button>
            </form>
          )}
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
          ) : listings.length === 0 ? (
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.discovery} />
          ) : null}
          <p className="mt-2 text-[11px] text-muted">{discovery?.remaining ?? 10} slots left</p>
        </section>

        {/* RIVALS */}
        <section className="luxury-card p-5">
          <h2 className="font-display text-[16px] font-semibold">Rivals</h2>
          <p className="mt-1 text-[12px] text-muted">Track competitors — daily gap alerts.</p>
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
          ) : listings.length === 0 ? (
            <DemoPreview {...FOUNDER_FEATURE_DEMOS.rivals} />
          ) : null}
        </section>

        {/* CALL IT */}
        <section className="luxury-card p-5 lg:col-span-2">
          <h2 className="font-display text-[16px] font-semibold">Call It</h2>
          <p className="mt-1 text-[12px] text-muted">Free nightly #1 prediction — correct calls boost score.</p>
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
        </section>

        {/* KEEPER — compact */}
        <section className="luxury-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[16px] font-semibold">Keeper levels</h2>
            <Link href="/rooms" className="text-[12px] font-medium text-accent hover:underline">
              Browse rooms →
            </Link>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Observer → Member → Scout → Keeper → Senior Keeper → Legendary. Earn through discovery and curation.
          </p>
          {me?.keeperLevels?.length > 0 ? (
            <p className="mt-3 text-[13px]">
              Your levels:{" "}
              {me.keeperLevels.map((k: { room: string; level: string }) => `${k.room} (${k.level})`).join(", ")}
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Add a Discovery bet to start climbing.</p>
          )}
          <details className="mt-3 text-[12px] text-muted">
            <summary className="cursor-pointer font-medium text-foreground">Room scarcity rules</summary>
            <ul className="mt-2 space-y-1">
              {ROOM_SCARCITY_RULES.map((r) => (
                <li key={r.type}>
                  <strong>{r.type}:</strong> {r.rule}
                </li>
              ))}
            </ul>
          </details>
        </section>
        </div>

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

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="luxury-card p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono-label mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-green">{hint}</p>}
    </div>
  );
}
