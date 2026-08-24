"use client";

import { KEEPER_LEVEL_INFO, keeperLevelRank } from "@/lib/keeper-privileges";

type Quotas = {
  level: string;
  discoveryUsed: number;
  discoveryLimit: number;
  discoveryRemaining: number;
  roomsCurated: number;
  roomLimit: number;
  roomsRemaining: number;
  hasRoomPro?: boolean;
};

export function KeeperUnlockRail({
  myLevel,
  isCurator,
  quotas,
}: {
  myLevel: string;
  isCurator?: boolean;
  quotas?: Quotas;
}) {
  const displayLevel = isCurator && myLevel === "observer" ? "keeper" : myLevel;
  const myRank = keeperLevelRank(displayLevel);

  return (
    <div className="mt-4 space-y-2">
      {KEEPER_LEVEL_INFO.map((step) => {
        const rank = keeperLevelRank(step.level);
        const unlocked = rank <= myRank || (isCurator && rank <= keeperLevelRank("keeper"));
        const isCurrent = step.level === displayLevel;
        return (
          <div
            key={step.level}
            className={`rounded-lg border px-3 py-2 text-[11.5px] ${
              isCurrent
                ? "border-accent bg-accent-soft"
                : unlocked
                  ? "border-border/80 bg-surface/60"
                  : "border-border/50 bg-surface-2/40 opacity-70"
            }`}
          >
            <p className="font-semibold">
              {unlocked ? step.emoji : "🔒"} {step.label}
              {isCurrent ? " · you" : ""}
            </p>
            <p className="mt-0.5 text-muted">{step.privilege}</p>
            {!unlocked && <p className="mt-1 text-accent">{step.howToEarn}</p>}
          </div>
        );
      })}

      {quotas && (
        <div className="rounded-lg border border-border/80 bg-surface/80 px-3 py-2 text-[11px] text-muted">
          <p>
            Discovery: {quotas.discoveryUsed}/{quotas.discoveryLimit} bets
            {quotas.discoveryRemaining <= 0 && quotas.level === "member" ? " · add 2 more picks for Scout" : ""}
          </p>
          <p className="mt-1">
            Rooms curated: {quotas.roomsCurated}/{quotas.roomLimit}
            {quotas.hasRoomPro ? " · Room Pro +1 slot" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
