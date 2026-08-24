"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RoomCommunityHeader } from "@/components/RoomCommunityHeader";
import { RoomEventFeed } from "@/components/RoomEventFeed";
import { RoomKeeperPanel } from "@/components/RoomKeeperPanel";
import { RoomPinnedProducts, RoomKeeperTools } from "@/components/RoomKeeperTools";
import { UnderdogRowSection } from "@/components/UnderdogRowSection";
import { KeeperInviteTracker } from "@/components/KeeperInviteTracker";
import { PAGE_WIDE } from "@/lib/layout";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/** Community room UI for custom / nested rooms (not category ?room= pages). */
export function CommunityRoomInterior({
  roomSlug,
  categorySlug,
  roomName,
}: {
  roomSlug: string;
  categorySlug?: string | null;
  roomName: string;
}) {
  const { data } = useSWR<{ room?: { sponsored?: boolean; sponsorLabel?: string | null; geoRelevanceNote?: string | null } }>(
    `/api/rooms/${encodeURIComponent(roomSlug)}`,
    fetcher
  );

  return (
    <div className={`${PAGE_WIDE} pb-10 pt-6`}>
      <Suspense fallback={null}>
        <KeeperInviteTracker roomSlug={roomSlug} />
      </Suspense>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-muted hover:border-accent hover:text-accent"
        >
          ← All rooms
        </Link>
        {categorySlug && (
          <Link href={`/?room=${categorySlug}`} className="text-[13px] font-medium text-accent hover:underline">
            Open {roomName} leaderboard →
          </Link>
        )}
      </div>

      {data?.room?.sponsored && (
        <p className="mb-4 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent">
          Sponsored placement{data.room.sponsorLabel ? `: ${data.room.sponsorLabel}` : ""} — does not affect rank
        </p>
      )}

      {data?.room?.geoRelevanceNote && (
        <p className="mb-4 text-[13px] text-muted">
          <span className="font-semibold text-foreground">Geo relevance:</span> {data.room.geoRelevanceNote}
        </p>
      )}

      <RoomCommunityHeader roomSlug={roomSlug} />

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <RoomEventFeed roomIdOrSlug={roomSlug} />
        <RoomKeeperPanel roomSlug={roomSlug} />
        {categorySlug ? <UnderdogRowSection categorySlug={categorySlug} /> : (
          <div className="luxury-card p-5">
            <h3 className="font-display text-[16px] font-semibold">Community room</h3>
            <p className="mt-2 text-[13px] text-muted">
              No category board linked — pin any live listing from the global board. Claim products from{" "}
              <Link href="/#claim" className="text-accent hover:underline">
                homepage
              </Link>{" "}
              first.
            </p>
          </div>
        )}
      </div>

      <RoomPinnedProducts roomSlug={roomSlug} />
      <RoomKeeperTools roomSlug={roomSlug} categorySlug={categorySlug} />

      {!categorySlug && (
        <p className="mt-4 text-center text-[12px] text-muted">
          Want a live leaderboard here? Request a room linked to a category, or claim from{" "}
          <Link href="/rooms" className="text-accent hover:underline">
            category rooms
          </Link>
          .
        </p>
      )}
    </div>
  );
}
