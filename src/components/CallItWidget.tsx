"use client";

import { useState } from "react";

export function CallItWidget({
  boardId,
  listingSlug,
  roomName,
}: {
  boardId: string | null;
  listingSlug: string;
  roomName: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!boardId) return null;

  async function predict() {
    setLoading(true);
    setMsg(null);
    const listing = await fetch(`/api/listings?scope=global&limit=50`).then((r) => r.json());
    const entry = listing.entries?.find((e: { slug: string }) => e.slug === listingSlug);
    if (!entry) {
      setMsg("Listing not on board yet.");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/boards/${boardId}/call-it`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictedListingId: entry.id }),
    });
    setLoading(false);
    setMsg(
      res.ok
        ? `Locked — you called ${listingSlug} for #1 in ${roomName} tonight. Free, no payment.`
        : "Could not save prediction."
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent-soft/30 p-4">
      <h3 className="text-[13px] font-semibold">🔮 Call It</h3>
      <p className="mt-1 text-[12px] text-muted">
        Predict who hits #1 in this room by midnight UTC. Reputation only — zero money.
      </p>
      <button
        type="button"
        onClick={predict}
        disabled={loading}
        className="mt-3 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Saving…" : `Call it: ${listingSlug} takes #1`}
      </button>
      {msg && <p className="mt-2 text-[12px] text-muted">{msg}</p>}
    </div>
  );
}
