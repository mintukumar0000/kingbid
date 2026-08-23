"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { EventShareButton } from "@/components/EventShareButton";

export function RoomEventFeed({ roomIdOrSlug }: { roomIdOrSlug: string }) {
  const { data } = useSWR<{
    events: { headline: string; at: string; eventType: string }[];
  }>(`/api/rooms/${encodeURIComponent(roomIdOrSlug)}/events`, fetcher, { refreshInterval: 20_000 });

  if (!data?.events.length) {
    return (
      <div className="rounded-xl border border-border bg-[#faf8f5] p-4 text-[13px] text-muted">
        0 room events yet — activity appears when founders bid.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-[#faf8f5] p-4">
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted">Latest activity</h3>
      <ul className="mt-3 space-y-2 text-[13px]">
        {data.events.slice(0, 8).map((e) => (
          <li key={e.at + e.headline} className="border-b border-border/60 pb-2 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{e.headline}</span>
              {(e.eventType === "dethronement" || e.eventType === "milestone_reign") && (
                <EventShareButton headline={e.headline} eventType={e.eventType} room={roomIdOrSlug} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
