"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";

export function RoomKeeperBlock({ roomSlug }: { roomSlug: string }) {
  const { data } = useSWR<{
    keepers: { handle: string; level: string; profileUrl: string }[];
    myKeeperLevel: string;
    levelRules: { level: string; rule: string }[];
    room: { keeperCount: number; listingCount: number; boardId: string | null };
  }>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);

  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-[#faf8f5] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted">Room Keepers</h3>
          <p className="mt-1 text-[13px] text-muted">
            {data.room.keeperCount} keepers · {data.room.listingCount} live listings
          </p>
        </div>
        <Link
          href="/founders"
          className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium hover:border-accent"
        >
          Become a keeper →
        </Link>
      </div>

      {data.keepers.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {data.keepers.map((k) => (
            <li key={k.profileUrl} className="flex items-center justify-between text-[13px]">
              <Link href={k.profileUrl} className="font-medium hover:underline">
                {k.handle}
              </Link>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                {k.level.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-muted">0 keepers yet — add Discovery bets on /founders to level up.</p>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Your level here: <strong className="text-foreground">{data.myKeeperLevel.replace(/_/g, " ")}</strong>
      </p>
    </div>
  );
}
