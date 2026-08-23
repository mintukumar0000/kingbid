"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/format";

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

export function RoomKeeperTools({ roomSlug }: { roomSlug: string }) {
  const { data, mutate } = useSWR<{
    canManage: boolean;
    myKeeperLevel: string;
    room: { boardId: string | null };
  }>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);

  const { data: pinData, mutate: mutatePins } = useSWR<{ pins: Pin[] }>(
    `/api/rooms/${encodeURIComponent(roomSlug)}/pins`,
    fetcher
  );

  const [listingSlug, setListingSlug] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  if (!data?.canManage) return null;

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
      setMsg("Pinned.");
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

  const field =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-[12px] outline-none focus:border-accent";

  return (
    <div className="luxury-card mt-4 p-5">
      <p className="font-display text-[15px] font-semibold">Keeper tools</p>
      <p className="mt-1 text-[12px] text-muted">Senior Keeper — pin up to 3 products · run weekly events</p>

      {msg && <p className="mt-2 text-[12px] text-accent">{msg}</p>}

      <form onSubmit={pin} className="mt-3 flex gap-2">
        <input
          className={field}
          placeholder="Listing slug to pin"
          value={listingSlug}
          onChange={(e) => setListingSlug(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading === "pin" || !listingSlug.trim()}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          Pin
        </button>
      </form>

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
