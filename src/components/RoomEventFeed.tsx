"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { EventShareButton } from "@/components/EventShareButton";
import { RelativeTime } from "@/components/RelativeTime";

function eventIcon(eventType: string): string {
  switch (eventType) {
    case "dethronement":
      return "🔥";
    case "new_reign":
      return "👑";
    case "comeback":
      return "🔁";
    case "milestone_reign":
      return "👑";
    case "breakout":
      return "🚀";
    case "new_founder":
      return "✨";
    case "kingmaker_called_it":
      return "🎯";
    default:
      return "📜";
  }
}

export function RoomEventFeed({ roomIdOrSlug }: { roomIdOrSlug: string }) {
  const { data } = useSWR<{
    events: { headline: string; at: string; eventType: string }[];
  }>(`/api/rooms/${encodeURIComponent(roomIdOrSlug)}/events`, fetcher, { refreshInterval: 20_000 });

  return (
    <div className="bracket-card !p-5">
      <h3 className="font-display text-[17px] font-semibold">This week&apos;s events</h3>
      <p className="mt-1 text-[12px] text-muted">The room produces its own story — dethronements, breakouts, new founders.</p>

      {!data?.events.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-[13px] text-muted">
          0 events yet — activity appears when founders bid, dethrone, or break out.
        </p>
      ) : (
        <ul className="mt-4 space-y-0">
          {data.events.slice(0, 8).map((e) => (
            <li key={e.at + e.headline} className="history-row !px-0">
              <span className="text-[16px]" aria-hidden>
                {eventIcon(e.eventType)}
              </span>
              <span className="flex-1 text-[13px]">{e.headline}</span>
              <RelativeTime date={e.at} className="font-mono-label shrink-0 text-[11px] text-muted" />
              {(e.eventType === "dethronement" || e.eventType === "milestone_reign") && (
                <EventShareButton headline={e.headline} eventType={e.eventType} room={roomIdOrSlug} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
