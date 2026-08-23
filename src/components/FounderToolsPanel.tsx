"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { REVENUE_BANDS, REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";

export function FounderToolsPanel({
  listingId,
  boardId,
  slug,
  revenueBand,
}: {
  listingId: string;
  boardId: string | null;
  slug: string;
  revenueBand: string | null;
}) {
  const [rivalSlug, setRivalSlug] = useState("");
  const [platform, setPlatform] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [predictListingId, setPredictListingId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const { data: rivals, mutate: mutateRivals } = useSWR<{
    rivals: { id: string; rival: { displayUrl: string; currentBid: number }; gap: number }[];
  }>("/api/rivals", fetcher);

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent";

  async function saveBand(band: RevenueBand) {
    const res = await fetch("/api/verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, verificationType: "revenue_band", revenueBand: band }),
    });
    setMsg(res.ok ? "Revenue band saved (unverified)." : "Could not save band.");
  }

  async function addRival(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/rivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, rivalListingId: rivalSlug }),
    });
    if (res.ok) {
      mutateRivals();
      setRivalSlug("");
      setMsg("Rival tracked.");
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Could not add rival.");
    }
  }

  async function migrationClaim(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/migration-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        claimedPreviousPlatform: platform,
        evidenceUrl: evidenceUrl || undefined,
        badge: "founding_migrator",
      }),
    });
    setMsg(res.ok ? "Migration badge claimed (self-reported)." : "Claim failed.");
  }

  async function callIt(e: React.FormEvent) {
    e.preventDefault();
    if (!boardId) {
      setMsg("Global board only for Call It until room board is set.");
      return;
    }
    const res = await fetch(`/api/boards/${boardId}/call-it`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictedListingId: predictListingId || listingId }),
    });
    setMsg(res.ok ? "Prediction locked — resolves at midnight UTC. No money involved." : "Call It failed.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold">Revenue band (Underdog Row)</h3>
        <p className="mt-1 text-[12px] text-muted">
          Current: {revenueBand ? REVENUE_BAND_LABELS[revenueBand as RevenueBand] : "not set"}
          {!revenueBand && " (unverified)"}
        </p>
        <select
          className={`${field} mt-2`}
          defaultValue={revenueBand ?? ""}
          onChange={(e) => saveBand(e.target.value as RevenueBand)}
        >
          <option value="" disabled>
            Update band…
          </option>
          {REVENUE_BANDS.map((b) => (
            <option key={b} value={b}>
              {REVENUE_BAND_LABELS[b]}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={addRival}>
        <h3 className="text-[13px] font-semibold">Track a rival</h3>
        <input
          className={`${field} mt-2`}
          placeholder="Rival listing UUID (from stats URL)"
          value={rivalSlug}
          onChange={(e) => setRivalSlug(e.target.value)}
        />
        <button type="submit" className="mt-2 text-[13px] font-medium text-accent hover:underline">
          Add rival →
        </button>
        {rivals?.rivals.length ? (
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            {rivals.rivals.map((r) => (
              <li key={r.id}>
                vs {r.rival.displayUrl} · gap ${Math.abs(r.gap)}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={callIt}>
        <h3 className="text-[13px] font-semibold">Call It (free prediction)</h3>
        <p className="text-[12px] text-muted">Reputation only — zero monetary stakes.</p>
        <button type="submit" className="mt-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium hover:border-accent">
          Predict this listing hits #1 tonight
        </button>
      </form>

      <form onSubmit={migrationClaim}>
        <h3 className="text-[13px] font-semibold">Migration badge (self-reported)</h3>
        <p className="text-[12px] text-muted">Not an official import — badge for your claim only.</p>
        <input
          className={`${field} mt-2`}
          placeholder="Previous platform name"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          required
        />
        <input
          className={`${field} mt-2`}
          placeholder="Evidence URL (optional)"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
        />
        <button type="submit" className="mt-2 text-[13px] font-medium text-accent hover:underline">
          Claim founding migrator badge →
        </button>
      </form>

      {msg && <p className="text-[12px] text-muted">{msg}</p>}
    </div>
  );
}
