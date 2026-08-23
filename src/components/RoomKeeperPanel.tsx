"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { keeperLevelRank, KEEPER_LEVEL_INFO } from "@/lib/keeper-privileges";

type Payload = {
  myKeeperLevel: string;
  keepers: { handle: string; level: string; profileUrl: string }[];
  room: { keeperCount: number };
};

export function RoomKeeperPanel({ roomSlug }: { roomSlug: string }) {
  const { data } = useSWR<Payload>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);

  if (!data) {
    return <div className="luxury-card h-40 animate-pulse" />;
  }

  const myRank = keeperLevelRank(data.myKeeperLevel);
  const current = KEEPER_LEVEL_INFO.find((s) => s.level === data.myKeeperLevel) ?? KEEPER_LEVEL_INFO[0]!;
  const next = KEEPER_LEVEL_INFO.find((s) => keeperLevelRank(s.level) === myRank + 1);

  return (
    <div className="luxury-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold">Keepers</h3>
        <Link href="/founders" className="text-[12px] font-semibold text-accent hover:underline">
          Level up →
        </Link>
      </div>

      {/* Compact progress rail */}
      <div className="mt-4 flex items-center gap-1">
        {KEEPER_LEVEL_INFO.map((step) => {
          const rank = keeperLevelRank(step.level);
          const active = rank <= myRank;
          const isCurrent = step.level === data.myKeeperLevel;
          return (
            <div
              key={step.level}
              title={step.label}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                isCurrent ? "bg-accent" : active ? "bg-accent/40" : "bg-border"
              }`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>Observer</span>
        <span>Legendary</span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-surface/80 px-3 py-2.5">
        <p className="text-[12px] text-muted">
          You: <span className="font-semibold text-foreground">{current.emoji} {current.label}</span>
        </p>
        <p className="mt-0.5 text-[11.5px] text-muted">{current.privilege}</p>
        {next && myRank < keeperLevelRank(next.level) && (
          <p className="mt-2 text-[11px] text-accent">
            Next → {next.label}: {next.howToEarn}
          </p>
        )}
      </div>

      {data.keepers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.keepers.slice(0, 4).map((k) => (
            <Link
              key={k.profileUrl}
              href={k.profileUrl}
              className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium hover:border-accent"
            >
              @{k.handle}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
