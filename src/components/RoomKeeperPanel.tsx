"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { keeperLevelRank, KEEPER_LEVEL_INFO, ROOM_SCARCITY_RULES } from "@/lib/keeper-privileges";

type Payload = {
  myKeeperLevel: string;
  levelLadder: typeof KEEPER_LEVEL_INFO;
  keepers: { handle: string; level: string; profileUrl: string }[];
  room: { keeperCount: number };
};

export function RoomKeeperPanel({ roomSlug }: { roomSlug: string }) {
  const { data } = useSWR<Payload>(`/api/rooms/${encodeURIComponent(roomSlug)}`, fetcher);

  if (!data) return null;

  const myRank = keeperLevelRank(data.myKeeperLevel);

  return (
    <div className="bracket-card !p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-semibold">Room Keepers</h3>
          <p className="mt-1 text-[12px] text-muted">
            Status economy — earned through discovery, not bought. {data.room.keeperCount} active in this room.
          </p>
        </div>
        <Link href="/founders" className="enter-btn">
          Level up →
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {data.levelLadder.map((step) => {
          const rank = keeperLevelRank(step.level);
          const unlocked = myRank >= rank;
          const current = data.myKeeperLevel === step.level;
          return (
            <div
              key={step.level}
              className={`rounded-xl border px-3 py-2.5 text-[12.5px] transition-colors ${
                current
                  ? "border-accent bg-accent-soft/40"
                  : unlocked
                    ? "border-border bg-surface-2/50"
                    : "border-border/60 bg-surface opacity-80"
              }`}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden>{step.emoji}</span>
                <span className="font-semibold">{step.label}</span>
                {current && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">You</span>
                )}
                {unlocked && !current && (
                  <span className="text-[10px] text-green">Unlocked</span>
                )}
              </div>
              <p className="mt-1 text-[11.5px] text-muted">{step.privilege}</p>
              {!unlocked && (
                <p className="mt-0.5 text-[11px] text-accent/80">{step.howToEarn}</p>
              )}
            </div>
          );
        })}
      </div>

      {data.keepers.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Active keepers</p>
          <ul className="mt-2 space-y-1.5">
            {data.keepers.slice(0, 5).map((k) => (
              <li key={k.profileUrl} className="flex items-center justify-between text-[13px]">
                <Link href={k.profileUrl} className="font-medium hover:text-accent hover:underline">
                  @{k.handle}
                </Link>
                <span className="text-[11px] text-muted">{k.level.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-4 text-[11.5px] text-muted">
        <summary className="cursor-pointer font-medium text-foreground">Room scarcity rules</summary>
        <ul className="mt-2 space-y-1.5 pl-1">
          {ROOM_SCARCITY_RULES.map((r) => (
            <li key={r.type}>
              <strong>{r.type}:</strong> {r.rule}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
