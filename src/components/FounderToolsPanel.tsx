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
  const [platform, setPlatform] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [rivalSlug, setRivalSlug] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const { data: rivals, mutate: mutateRivals } = useSWR<{
    rivals: { id: string; rival: { displayUrl: string }; gapLabel: string }[];
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
    const res = await fetch("/api/rivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug: slug, rivalSlug: rivalSlug.trim() }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Rival tracked." : d.error);
    if (res.ok) {
      setRivalSlug("");
      mutateRivals();
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

  async function callIt() {
    if (!boardId) {
      setMsg("Need a room board for Call It.");
      return;
    }
    const res = await fetch(`/api/boards/${boardId}/call-it`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictedListingId: listingId }),
    });
    setMsg(res.ok ? "Prediction locked for tonight — free, no payment." : "Call It failed.");
  }

  const myRivals = rivals?.rivals.filter((r) => true) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold">Revenue band (Underdog Row)</h3>
        <p className="mt-1 text-[12px] text-muted">
          Current: {revenueBand ? REVENUE_BAND_LABELS[revenueBand as RevenueBand] : "not set"}
          {revenueBand && " (unverified)"}
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
        <p className="text-[12px] text-muted">Use the rival&apos;s listing slug from their /l/ page URL.</p>
        <input
          className={`${field} mt-2`}
          placeholder="rival slug e.g. competitor-site"
          value={rivalSlug}
          onChange={(e) => setRivalSlug(e.target.value)}
        />
        <button type="submit" className="mt-2 text-[13px] font-medium text-accent hover:underline">
          Add rival →
        </button>
        {myRivals.length > 0 && (
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            {myRivals.map((r) => (
              <li key={r.id}>
                vs {r.rival.displayUrl} — {r.gapLabel}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div>
        <h3 className="text-[13px] font-semibold">Call It (free prediction)</h3>
        <p className="text-[12px] text-muted">Reputation only — zero monetary stakes.</p>
        <button
          type="button"
          onClick={callIt}
          className="mt-2 rounded-full border border-border px-4 py-2 text-[13px] font-medium hover:border-accent"
        >
          Predict this listing hits #1 tonight
        </button>
      </div>

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
