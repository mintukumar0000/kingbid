"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface TickerPayload {
  ticker: { id: string; html: string }[];
}

export function EcosystemTicker() {
  const { data } = useSWR<TickerPayload>("/api/home-ecosystem", fetcher, { refreshInterval: 25_000 });
  const items = data?.ticker ?? [
    { id: "loading", html: "👑 <b>KingBid</b> — live competitive kingdom loading…" },
  ];

  const loop = [...items, ...items];

  return (
    <div className="eco-ticker-wrap" aria-hidden>
      <div className="eco-ticker-track">
        {loop.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="eco-ticker-item"
            dangerouslySetInnerHTML={{ __html: item.html }}
          />
        ))}
      </div>
    </div>
  );
}
