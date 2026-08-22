"use client";

import type { BoardScope } from "@/lib/geo";
import { countryFlagEmoji } from "@/lib/geo";

interface Props {
  scope: BoardScope;
  countryCode: string;
  countryName: string | null;
  onChange: (scope: BoardScope) => void;
}

export function ScopeToggle({ scope, countryCode, countryName, onChange }: Props) {
  const localLabel = countryName
    ? `${countryFlagEmoji(countryCode)} Local · ${countryName}`
    : "Local";

  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 shadow-[var(--shadow)]">
      <button
        type="button"
        onClick={() => onChange("global")}
        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
          scope === "global" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        🌍 Bid globally
      </button>
      <button
        type="button"
        onClick={() => onChange("local")}
        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
          scope === "local" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        {localLabel}
      </button>
    </div>
  );
}
