"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";
import { keeperLevelLabel } from "@/lib/keeper-privileges";
import type { LeaderboardData } from "@/lib/leaderboard";

type Pin = {
  id: string;
  slug: string;
  displayUrl: string;
  title: string;
  currentBid: number;
  pinnedBy: string;
};

export function RoomPinnedProducts({ roomSlug }: { roomSlug: string }) {
  const { data } = useSWR<{ pins: Pin[] }>(`/api/rooms/${encodeURIComponent(roomSlug)}/pins`, fetcher);

  if (!data?.pins.length) return null;

  return (
    <div className="luxury-card mt-4 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">📌 Pinned by keepers</p>
      <ul className="mt-3 space-y-2">
        {data.pins.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 text-[13px]">
            <Link href={`/l/${p.slug}`} className="truncate font-medium hover:text-accent">
              {p.displayUrl}
            </Link>
            <span className="font-mono-label shrink-0 text-[11px] text-muted">{formatMoney(p.currentBid)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoomKeeperTools({
  roomSlug,
  categorySlug,
}: {
  roomSlug: string;
  categorySlug?: string | null;
}) {
  const { data, mutate } = useSWR<{
    canManage: boolean;
    isCurator?: boolean;
    myKeeperLevel: string;
    room: { boardId: string | null; categorySlug?: string | null; listingCount?: number; name?: string };
  }>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);

  const effectiveCategory = categorySlug ?? data?.room?.categorySlug ?? null;
  const listingsUrl = effectiveCategory
    ? `/api/listings?limit=30&category=${encodeURIComponent(effectiveCategory)}`
    : "/api/listings?limit=30";
  const { data: board } = useSWR<LeaderboardData>(listingsUrl, fetcher);

  const { data: pinData, mutate: mutatePins } = useSWR<{ pins: Pin[] }>(
    `/api/rooms/${encodeURIComponent(roomSlug)}/pins`,
    fetcher
  );

  const [listingSlug, setListingSlug] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const canUse = data?.canManage || data?.isCurator;
  const listings = board?.entries ?? [];
  const field =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px] outline-none focus:border-accent";

  if (!data) {
    return (
      <div className="luxury-card mt-4 p-5">
        <p className="font-display text-[15px] font-semibold">Keeper tools</p>
        <p className="mt-2 text-[12px] text-muted">Loading…</p>
      </div>
    );
  }

  async function pin(e: React.FormEvent) {
    e.preventDefault();
    setLoading("pin");
    setMsg(null);
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/pins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listingSlug: listingSlug.trim() }),
    });
    const d = await res.json();
    setLoading(null);
    if (res.ok) {
      setListingSlug("");
      setMsg("Pinned — shows above the room feed.");
      mutatePins();
      mutate();
    } else {
      setMsg(d.error ?? "Pin failed");
    }
  }

  async function unpin(pinId: string) {
    await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/pins?pinId=${pinId}`, {
      method: "DELETE",
      credentials: "include",
    });
    mutatePins();
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading("event");
    setMsg(null);
    const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/weekly-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: eventTitle.trim() }),
    });
    const d = await res.json();
    setLoading(null);
    if (res.ok) {
      setEventTitle("");
      setMsg("Weekly event created.");
    } else {
      setMsg(d.error ?? "Event failed");
    }
  }

  if (!canUse) {
    return (
      <div className="luxury-card mt-4 p-5">
        <p className="font-display text-[15px] font-semibold">Keeper tools</p>
        <p className="mt-2 text-[12px] text-muted">
          Pin & weekly events unlock for the <strong>curator</strong> of this room or a{" "}
          <strong>Senior Keeper</strong>. You&apos;re currently{" "}
          <strong>{keeperLevelLabel(data.myKeeperLevel)}</strong> in {data.room.name ?? "this room"}.
        </p>
        <p className="mt-2 text-[12px] text-muted">
          Curator shortcut: open <strong>your</strong> room at{" "}
          <Link href="/rooms" className="text-accent hover:underline">
            /rooms
          </Link>{" "}
          (e.g. india-saas) where you curate — Keeper tools appear there immediately.
        </p>
        <p className="mt-2 text-[12px] text-muted">
          For category rooms like Trending .lol, level up to Senior Keeper on{" "}
          <Link href="/founders" className="text-accent hover:underline">
            /founders
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="luxury-card mt-4 p-5">
      <p className="font-display text-[15px] font-semibold">Keeper tools</p>
      <p className="mt-1 text-[12px] text-muted">
        {data.isCurator ? "Curator" : "Senior Keeper"} — pin up to 3 products · run weekly events
      </p>

      {msg && <p className="mt-2 text-[12px] text-accent">{msg}</p>}

      {listings.length > 0 ? (
        <form onSubmit={pin} className="mt-3 flex flex-wrap gap-2">
          <select
            className={`${field} min-w-[200px] flex-1`}
            value={listingSlug}
            onChange={(e) => setListingSlug(e.target.value)}
          >
            <option value="">Pick a listing to pin…</option>
            {listings.map((l) => (
              <option key={l.id} value={l.slug}>
                #{l.rank} {l.displayUrl} ({l.slug})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading === "pin" || !listingSlug.trim()}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            Pin
          </button>
        </form>
      ) : (
        <p className="mt-3 text-[12px] text-muted">
          {effectiveCategory ? (
            <>
              No listings on this room board yet. Products claimed on the homepage stay global until you{" "}
              <strong>rebid from this room</strong> ($1+). Open{" "}
              <Link href={`/?room=${effectiveCategory}`} className="text-accent hover:underline">
                /?room={effectiveCategory}
              </Link>{" "}
              and claim from there.
            </>
          ) : (
            <>
              No listings to pin yet —{" "}
              <Link href="/#claim" className="text-accent hover:underline">
                claim #1
              </Link>{" "}
              first.
            </>
          )}
        </p>
      )}

      {pinData?.pins.length ? (
        <ul className="mt-2 space-y-1 text-[12px]">
          {pinData.pins.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span>{p.displayUrl}</span>
              <button type="button" onClick={() => unpin(p.id)} className="text-muted hover:text-accent">
                Unpin
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={createEvent} className="mt-4 flex gap-2">
        <input
          className={field}
          placeholder="Weekly event title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading === "event" || eventTitle.trim().length < 3}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </div>
  );
}
