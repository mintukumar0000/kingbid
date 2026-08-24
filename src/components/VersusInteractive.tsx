"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { formatMoney, faviconFor } from "@/lib/format";

type MatchupData = {
  id: string;
  status: string;
  ownerAConfirmed: boolean;
  ownerBConfirmed: boolean;
  listingA: { id: string; slug: string; title: string; displayUrl: string; currentBid: number };
  listingB: { id: string; slug: string; title: string; displayUrl: string; currentBid: number };
  votesA: number;
  votesB: number;
};

function MatchupCard({
  listing,
  votes,
  onVote,
  voting,
}: {
  listing: MatchupData["listingA"];
  votes: number;
  onVote: () => void;
  voting: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconFor(`https://${listing.displayUrl.replace(/^@/, "")}`)}
        alt=""
        width={40}
        height={40}
        className="mx-auto h-10 w-10 rounded-full bg-surface-2"
      />
      <h2 className="mt-3 text-lg font-bold">{listing.displayUrl}</h2>
      <p className="text-[13px] text-muted">{listing.title}</p>
      <p className="mt-2 tabular font-semibold text-accent">{formatMoney(listing.currentBid)}</p>
      <p className="mt-4 tabular text-2xl font-bold">{votes.toLocaleString()} votes</p>
      <button
        type="button"
        onClick={onVote}
        disabled={voting}
        className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        Vote
      </button>
      <Link href={`/l/${listing.slug}`} className="mt-3 text-[12px] text-accent hover:underline">
        View listing →
      </Link>
    </div>
  );
}

export function VersusInteractive({ matchupId }: { matchupId: string }) {
  const { data, mutate } = useSWR<MatchupData>(
    `/api/matchups?id=${encodeURIComponent(matchupId)}`,
    fetcher,
    { refreshInterval: 8000 }
  );
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function confirmParticipation(forListingId: string) {
    setConfirming(forListingId);
    setError(null);
    try {
      const res = await fetch(`/api/matchups/${matchupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId: forListingId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not confirm.");
        setConfirming(null);
        return;
      }
      await mutate();
      setConfirming(null);
    } catch {
      setError("Network error.");
      setConfirming(null);
    }
  }

  async function vote(forListingId: string) {
    setVoting(true);
    setError(null);
    try {
      const res = await fetch(`/api/matchups/${matchupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votedForListingId: forListingId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not vote.");
        setVoting(false);
        return;
      }
      await mutate();
      setVoting(false);
    } catch {
      setError("Network error.");
      setVoting(false);
    }
  }

  if (!data) {
    return <p className="mt-6 text-center text-muted">Loading…</p>;
  }

  return (
    <>
      {data.status === "pending" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow)]">
          <p className="text-[15px] font-semibold">Confirm to go live</p>
          <p className="mt-2 text-[13px] text-muted">
            Both listings must confirm before voting opens and the battle shows on the homepage.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {!data.ownerAConfirmed ? (
              <button
                type="button"
                disabled={!!confirming}
                onClick={() => confirmParticipation(data.listingA.id)}
                className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {confirming === data.listingA.id ? "Confirming…" : `Confirm ${data.listingA.displayUrl}`}
              </button>
            ) : (
              <span className="rounded-full border border-green/30 bg-green/10 px-4 py-2 text-[13px] font-medium text-green">
                ✓ {data.listingA.displayUrl} confirmed
              </span>
            )}
            {!data.ownerBConfirmed ? (
              <button
                type="button"
                disabled={!!confirming}
                onClick={() => confirmParticipation(data.listingB.id)}
                className="rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold hover:border-accent disabled:opacity-50"
              >
                {confirming === data.listingB.id ? "Confirming…" : `Confirm ${data.listingB.displayUrl}`}
              </button>
            ) : (
              <span className="rounded-full border border-green/30 bg-green/10 px-4 py-2 text-[13px] font-medium text-green">
                ✓ {data.listingB.displayUrl} confirmed
              </span>
            )}
          </div>
          <p className="mt-4 text-[12px] text-muted">
            Testing solo? Open each listing page and confirm from{" "}
            <Link href={`/l/${data.listingA.slug}`} className="text-accent hover:underline">
              /l/{data.listingA.slug}
            </Link>{" "}
            and{" "}
            <Link href={`/l/${data.listingB.slug}`} className="text-accent hover:underline">
              /l/{data.listingB.slug}
            </Link>
            .
          </p>
        </div>
      )}
      {data.status === "active" && (
        <p className="mt-4 text-center text-[13px] text-muted">
          Live on the homepage under <strong>Live Battles</strong> — share this page for votes.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <MatchupCard
          listing={data.listingA}
          votes={data.votesA}
          onVote={() => vote(data.listingA.id)}
          voting={voting || data.status !== "active"}
        />
        <div className="flex items-center justify-center text-xl font-bold text-muted">VS</div>
        <MatchupCard
          listing={data.listingB}
          votes={data.votesB}
          onVote={() => vote(data.listingB.id)}
          voting={voting || data.status !== "active"}
        />
      </div>
      {error && <p className="mt-4 text-center text-sm text-red">{error}</p>}
    </>
  );
}
