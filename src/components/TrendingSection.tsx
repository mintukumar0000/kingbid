"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { faviconFor, outboundUrl } from "@/lib/format";
import { countryFlagEmoji } from "@/lib/geo";
import type { BoardScope } from "@/lib/geo";
import { SideCard } from "@/components/SideCard";

interface TrendingItem {
  id: string;
  title: string;
  displayUrl: string;
  url: string;
  currentBid: number;
  clicksPerHour: number;
  countryCode?: string | null;
}

interface Props {
  scope?: BoardScope;
  countryCode?: string | null;
}

export function TrendingSection({ scope = "global", countryCode }: Props) {
  const url =
    scope === "local" && countryCode
      ? `/api/trending?scope=local&country=${encodeURIComponent(countryCode)}`
      : "/api/trending?scope=global";

  const { data } = useSWR<{ trending: TrendingItem[] }>(url, fetcher, {
    refreshInterval: 15_000,
  });
  const items = data?.trending ?? [];
  const title =
    scope === "local" && countryCode
      ? `🔥 Trending in ${countryFlagEmoji(countryCode)}`
      : "🔥 Trending right now";

  return (
    <SideCard title={title}>
      {items.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted">
          No clicks in the last hour yet. Be the first.
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconFor(item.url)}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-full bg-surface-2"
                loading="lazy"
              />
              <a
                href={outboundUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() =>
                  fetch("/api/click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ listingId: item.id }),
                    keepalive: true,
                  }).catch(() => {})
                }
                className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground hover:text-accent transition-colors"
              >
                {item.countryCode && scope === "global" && (
                  <span className="mr-1" aria-hidden>
                    {countryFlagEmoji(item.countryCode)}
                  </span>
                )}
                {item.displayUrl}
              </a>
              <span className="tabular shrink-0 text-[13px] text-muted">
                {item.clicksPerHour.toLocaleString()} clicks/h
              </span>
            </li>
          ))}
        </ol>
      )}
    </SideCard>
  );
}
