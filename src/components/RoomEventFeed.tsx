"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { RelativeTime } from "@/components/RelativeTime";

function eventIcon(eventType: string): string {
  switch (eventType) {
    case "dethronement":
      return "🔥";
    case "new_reign":
      return "👑";
    case "breakout":
      return "🚀";
    case "new_founder":
      return "✨";
    case "room_weekly_event":
      return "📅";
    case "room_pin":
      return "📌";
    default:
      return "·";
  }
}

export function RoomEventFeed({ roomIdOrSlug }: { roomIdOrSlug: string }) {
  const { data } = useSWR<{
    events: { headline: string; at: string; eventType: string }[];
  }>(`/api/rooms/${encodeURIComponent(roomIdOrSlug)}/events`, fetcher, { refreshInterval: 20_000 });

  return (
    <div className="luxury-card p-5">
      <h3 className="font-display text-[16px] font-semibold">This week</h3>
      {!data?.events.length ? (
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          No events yet — shows up when founders bid or take the crown.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.events.slice(0, 5).map((e) => (
            <li key={e.at + e.headline} className="flex items-start gap-2 text-[13px]">
              <span className="shrink-0">{eventIcon(e.eventType)}</span>
              <span className="min-w-0 flex-1 text-foreground/90">{e.headline}</span>
              <RelativeTime date={e.at} className="font-mono-label shrink-0 text-[10px] text-muted" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
