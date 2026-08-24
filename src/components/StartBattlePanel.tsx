"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { createAndActivateMatchup } from "@/lib/start-matchup";
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
    const result = await createAndActivateMatchup(listingId, opponent.id);
    setLoading(false);
    if ("error" in result) {
      setMsg(result.error);
      return;
    }
    router.push(`/versus/${result.id}`);
  }

  async function startFromSlug(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = opponentSlug.trim();
    if (!trimmed) return;

    const opponent = findOpponent(trimmed, opponents);
    if (!opponent) {
      setMsg(`Rival not found — try "${opponents[0]?.displayUrl ?? "outbid.lol"}".`);
      return;
    }
    await startBattle(opponent);
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent";

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted">
        Or start from the{" "}
        <Link href="/#live-battles" className="text-accent hover:underline">
          homepage Live Battles
        </Link>{" "}
        section — pick both products in one click.
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
          Need at least 2 live listings —{" "}
          <Link href="/#claim" className="text-accent hover:underline">
            claim another spot
          </Link>
          .
        </p>
      )}

      <form onSubmit={startFromSlug} className="flex flex-wrap gap-2">
        <input
          className={`${field} min-w-[200px] flex-1`}
          placeholder={`Rival e.g. ${opponents[0]?.displayUrl ?? "outbid.lol"}`}
          value={opponentSlug}
          onChange={(e) => setOpponentSlug(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !opponentSlug.trim()}
          className="shrink-0 rounded-full border border-border px-5 py-2 text-[13px] font-semibold hover:border-accent disabled:opacity-50"
        >
          Challenge
        </button>
      </form>

      {msg && <p className="text-[12px] text-red">{msg}</p>}
    </div>
  );
}
