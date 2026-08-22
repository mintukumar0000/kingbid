"use client";

import { useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { faviconFor, formatMoney, outboundUrl } from "@/lib/format";
import { RelativeTime } from "@/components/RelativeTime";
import { countryFlagEmoji } from "@/lib/geo";
import type { BoardScope } from "@/lib/geo";

interface Props {
  entry: LeaderboardEntry;
  onClaim: (entry: LeaderboardEntry) => void;
  featured?: boolean;
  scope?: BoardScope;
}

export function ListingRow({ entry, onClaim, featured, scope = "global" }: Props) {
  const prevBid = useRef(entry.currentBid);
  const [flash, setFlash] = useState(false);
  const href = outboundUrl(entry.url);
  const isFeatured = featured ?? entry.rank <= 3;
  const flag = entry.countryCode ? countryFlagEmoji(entry.countryCode) : null;

  useEffect(() => {
    if (entry.currentBid !== prevBid.current) {
      prevBid.current = entry.currentBid;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1900);
      return () => clearTimeout(t);
    }
  }, [entry.currentBid]);

  function trackClick() {
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: entry.id }),
      keepalive: true,
    }).catch(() => {});
  }

  function openListing(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-no-row-nav]")) return;
    trackClick();
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (isFeatured) {
    return (
      <article
        role="link"
        tabIndex={0}
        onClick={openListing}
        onKeyDown={(e) => {
          if (e.key === "Enter") openListing(e as unknown as React.MouseEvent);
        }}
        className={`group relative mb-4 mt-3 cursor-pointer rounded-[20px] border border-[#f0cfc3] bg-peach px-5 py-5 transition-all duration-200 hover:border-accent hover:bg-[#fff0eb] hover:shadow-[0_0_0_1px_var(--accent)] sm:px-6 sm:py-6 ${
          flash ? "flash-row" : ""
        }`}
      >
        <button
          type="button"
          data-no-row-nav
          onClick={(e) => {
            e.stopPropagation();
            onClaim(entry);
          }}
          className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          claim this rank for {formatMoney(entry.claimPrice)}
        </button>

        {entry.takeoverActive && (
          <span className="absolute -top-2.5 right-5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
            🔒 takeover
          </span>
        )}

        <div className="flex items-start gap-3 sm:gap-4">
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-white">
            #{entry.rank}
          </span>

          {entry.kind === "x_handle" ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground text-lg font-black text-background">
              𝕏
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${faviconFor(entry.url)}&sz=128`}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full bg-surface object-cover ring-1 ring-border"
              loading="lazy"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <span className="truncate text-[17px] font-bold leading-tight sm:text-[18px]">
                {flag && (
                  <span className="mr-1.5" title={entry.countryCode ?? undefined} aria-hidden>
                    {flag}
                  </span>
                )}
                {entry.displayUrl}
              </span>
              <span className="tabular shrink-0 text-[22px] font-bold leading-none text-accent sm:text-[24px]">
                {formatMoney(entry.currentBid)}
              </span>
            </div>

            {entry.description && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{entry.description}</p>
            )}

            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
              <RelativeTime date={entry.lastBidAt} />
              <span className="text-accent">●</span>
              <span className="tabular">{entry.clickCount.toLocaleString()} clicks</span>
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openListing}
      onKeyDown={(e) => {
        if (e.key === "Enter") openListing(e as unknown as React.MouseEvent);
      }}
      className={`group cursor-pointer border-b border-border py-4 ${flash ? "flash-row" : ""}`}
    >
      <div className="flex items-start gap-3 px-1">
        <span className="tabular mt-1 w-7 shrink-0 text-[13px] text-muted">#{entry.rank}</span>

        {entry.kind === "x_handle" ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-black text-background">
            𝕏
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconFor(entry.url)}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-lg bg-surface-2"
            loading="lazy"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span className="truncate text-[15px] font-semibold group-hover:underline">
              {flag && (
                <span className="mr-1" aria-hidden>
                  {flag}
                </span>
              )}
              {entry.displayUrl}
            </span>
            <span className="tabular shrink-0 text-[17px] font-bold text-accent">
              {formatMoney(entry.currentBid)}
            </span>
          </div>
          {entry.description && (
            <p className="mt-1 line-clamp-1 text-[13px] text-muted">{entry.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
            <RelativeTime date={entry.lastBidAt} />
            <span className="text-accent">●</span>
            <span className="tabular">{entry.clickCount.toLocaleString()} clicks</span>
            <button
              type="button"
              data-no-row-nav
              onClick={(e) => {
                e.stopPropagation();
                onClaim(entry);
              }}
              className="ml-auto text-[12px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100"
            >
              claim for {formatMoney(entry.claimPrice)} →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
