"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatMoney, faviconFor } from "@/lib/format";
import { RelativeTime } from "@/components/RelativeTime";
import { SideCard } from "@/components/SideCard";

export interface ActivityItem {
  id: string;
  listingId: string;
  title: string;
  displayUrl: string;
  url?: string;
  amount: number;
  totalAfter: number;
  isTakeover: boolean;
  rank: number | null;
  at: string;
}

export function LiveActivityFeed({ limit = 5 }: { limit?: number }) {
  const { data } = useSWR<{ activity: ActivityItem[] }>("/api/activity", fetcher, {
    refreshInterval: 5_000,
  });
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data?.activity) return;
    if (seen.current === null) {
      seen.current = new Set(data.activity.map((a) => a.id));
      return;
    }
    const fresh = data.activity.filter((a) => !seen.current!.has(a.id));
    if (fresh.length > 0) {
      fresh.forEach((a) => seen.current!.add(a.id));
      setNewIds(new Set(fresh.map((a) => a.id)));
    }
  }, [data]);

  const items = (data?.activity ?? []).slice(0, limit);

  return (
    <SideCard title="Latest activity" dot="live">
      {items.length === 0 ? (
        <p className="text-[13px] text-muted">No bids yet. Be the first.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 ${newIds.has(item.id) ? "slide-in" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconFor(item.url ?? `https://${item.displayUrl.replace(/^@/, "")}`)}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-full bg-surface-2"
                loading="lazy"
              />
              <p className="min-w-0 flex-1 text-[13px] leading-snug">
                <span className="font-semibold text-foreground">{item.displayUrl}</span>{" "}
                {item.isTakeover ? (
                  <span className="text-muted">locked #1</span>
                ) : (
                  <span className="text-muted">
                    {item.rank != null ? <>at #{item.rank} · </> : null}
                    {formatMoney(item.totalAfter)}
                  </span>
                )}
              </p>
              <span className="shrink-0 text-[13px] text-muted whitespace-nowrap">
                <RelativeTime date={item.at} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </SideCard>
  );
}
