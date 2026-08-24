"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/leaderboard";

function findOpponent(slug: string, opponents: LeaderboardEntry[]) {
  const normalized = slug.trim().toLowerCase();
  return (
    opponents.find((o) => o.slug === normalized) ??
    opponents.find((o) => o.displayUrl.toLowerCase() === normalized) ??
    opponents.find((o) => o.slug.replace(/\./g, "-") === normalized)
  );
}

export function StartBattlePanel({
  listingId,
  displayUrl,
}: {
  listingId: string;
  slug: string;
  displayUrl: string;
}) {
  const router = useRouter();
  const { data: board } = useSWR<LeaderboardData>("/api/listings?limit=30", fetcher);
  const [opponentSlug, setOpponentSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const opponents = (board?.entries ?? []).filter((e) => e.id !== listingId);

  async function startBattle(opponent: LeaderboardEntry) {
    setLoading(true);
    setMsg(null);
    try {
      const createRes = await fetch("/api/matchups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingAId: listingId, listingBId: opponent.id }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        setMsg(created.error ?? "Could not start battle.");
        setLoading(false);
        return;
      }

      const confirmRes = await fetch(`/api/matchups/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId }),
      });
      const confirmed = await confirmRes.json();
      if (!confirmRes.ok) {
        setMsg(confirmed.error ?? "Battle created but confirm failed.");
        setLoading(false);
        return;
      }

      const rivalConfirm = await fetch(`/api/matchups/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId: opponent.id }),
      });
      const rivalBody = await rivalConfirm.json();
      if (!rivalConfirm.ok) {
        setMsg(rivalBody.error ?? "Confirm the rival on the battle page.");
        router.push(`/versus/${created.id}`);
        return;
      }

      if (rivalBody.status !== "active") {
        setMsg("Battle pending — confirm the rival on the next page.");
      }

      router.push(`/versus/${created.id}`);
    } catch {
      setMsg("Network error — try again.");
      setLoading(false);
    }
  }

  async function startFromSlug(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = opponentSlug.trim();
    if (!trimmed) return;

    const opponent = findOpponent(trimmed, opponents);
    if (!opponent) {
      setMsg(`Rival not found — use slug "${opponents[0]?.slug ?? "outbid.lol"}" (dots, not dashes).`);
      return;
    }
    await startBattle(opponent);
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent";

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted">
        Challenge another live listing. Both sides auto-confirm and the battle goes live on the homepage
        immediately. Use listing URLs like{" "}
        <Link href={`/l/${displayUrl}`} className="text-accent hover:underline">
          /l/{displayUrl}
        </Link>
        .
      </p>

      {opponents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <select
            className={`${field} min-w-[220px] flex-1`}
            value={opponentSlug}
            onChange={(e) => setOpponentSlug(e.target.value)}
          >
            <option value="">Pick a rival listing…</option>
            {opponents.map((o) => (
              <option key={o.id} value={o.slug}>
                #{o.rank} {o.displayUrl} ({formatMoney(o.currentBid)})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading || !opponentSlug}
            onClick={() => {
              const opponent = findOpponent(opponentSlug, opponents);
              if (opponent) startBattle(opponent);
              else setMsg("Pick a rival from the dropdown.");
            }}
            className="shrink-0 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start battle →"}
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-muted">
          Need at least 2 live listings on the board —{" "}
          <Link href="/#claim" className="text-accent hover:underline">
            claim another spot
          </Link>{" "}
          first.
        </p>
      )}

      <form onSubmit={startFromSlug} className="flex flex-wrap gap-2">
        <input
          className={`${field} min-w-[200px] flex-1`}
          placeholder="Or paste rival slug e.g. outbid.lol"
          value={opponentSlug}
          onChange={(e) => setOpponentSlug(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !opponentSlug.trim()}
          className="shrink-0 rounded-full border border-border px-5 py-2 text-[13px] font-semibold hover:border-accent disabled:opacity-50"
        >
          Challenge by slug
        </button>
      </form>

      {msg && <p className="text-[12px] text-red">{msg}</p>}
    </div>
  );
}
