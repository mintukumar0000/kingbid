"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { createAndActivateMatchup } from "@/lib/start-matchup";
import type { LeaderboardData } from "@/lib/leaderboard";

/** Homepage Live Battles — pick from the board, one click to go live. */
export function HomeLiveBattleStarter({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { data: board, mutate } = useSWR<LeaderboardData>("/api/listings?limit=10", fetcher);
  const listings = board?.entries ?? [];

  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (listings.length >= 2 && !sideA && !sideB) {
      setSideA(listings[0]!.id);
      setSideB(listings[1]!.id);
    }
  }, [listings, sideA, sideB]);

  async function launch(listingAId: string, listingBId: string) {
    if (listingAId === listingBId) {
      setMsg("Pick two different products.");
      return;
    }
    setLoading(true);
    setMsg(null);
    const result = await createAndActivateMatchup(listingAId, listingBId);
    setLoading(false);
    if ("error" in result) {
      setMsg(result.error);
      return;
    }
    await mutate();
    router.push(`/versus/${result.id}`);
  }

  const field =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-accent";

  if (listings.length < 2) {
    return (
      <div className={compact ? "text-[13px] text-muted" : ""}>
        <p className="text-[13px] text-muted">
          Need 2 live products on the board to battle —{" "}
          <Link href="/#claim" className="font-medium text-accent hover:underline">
            claim a spot
          </Link>{" "}
          first, then come back here.
        </p>
      </div>
    );
  }

  const top = listings[0]!;
  const second = listings[1]!;

  return (
    <div className="space-y-4">
      {!compact && (
        <p className="text-[13px] text-muted">
          Pick any two products from the live board — no listing URL needed. One click and the battle shows
          right here.
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => launch(top.id, second.id)}
        className="w-full rounded-full bg-accent px-5 py-3 text-[14px] font-semibold text-white hover:brightness-110 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Starting…" : `⚔️ Battle #1 ${top.displayUrl} vs #2 ${second.displayUrl}`}
      </button>

      <details className="group">
        <summary className="cursor-pointer text-[13px] font-medium text-accent hover:underline">
          Or pick different products
        </summary>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-[12px]">
            <span className="mb-1 block text-muted">Side A</span>
            <select className={field} value={sideA} onChange={(e) => setSideA(e.target.value)}>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.rank} {l.displayUrl} ({formatMoney(l.currentBid)})
                </option>
              ))}
            </select>
          </label>
          <span className="hidden px-1 pb-2.5 font-bold text-muted sm:inline">vs</span>
          <label className="flex-1 text-[12px]">
            <span className="mb-1 block text-muted">Side B</span>
            <select className={field} value={sideB} onChange={(e) => setSideB(e.target.value)}>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.rank} {l.displayUrl} ({formatMoney(l.currentBid)})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={loading || !sideA || !sideB || sideA === sideB}
            onClick={() => launch(sideA, sideB)}
            className="shrink-0 rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold hover:border-accent disabled:opacity-50"
          >
            Start battle
          </button>
        </div>
      </details>

      {msg && <p className="text-[12px] text-red">{msg}</p>}
    </div>
  );
}
