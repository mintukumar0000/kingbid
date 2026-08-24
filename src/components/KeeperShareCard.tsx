"use client";

import Link from "next/link";
import { keeperLevelLabel } from "@/lib/keeper-privileges";
import type { KeeperLevel } from "@/lib/keepers";
import { buildKeeperShareText, buildKeeperShareUrl, twitterShareUrl } from "@/lib/viral";

export function KeeperShareCard({
  level,
  roomName,
  roomSlug,
  userHandle,
  userId,
}: {
  level: KeeperLevel | string;
  roomName?: string;
  roomSlug?: string;
  userHandle?: string;
  userId?: string;
}) {
  const label = keeperLevelLabel(level);
  const text = buildKeeperShareText({
    level: level as KeeperLevel,
    roomName,
    roomSlug,
    userHandle,
  });
  const url = buildKeeperShareUrl(roomSlug, userId);
  const og = `/api/og?event=Keeper+level+up&headline=${encodeURIComponent(`${userHandle ? `@${userHandle}` : "I"} → ${label}`)}${roomName ? `&room=${encodeURIComponent(roomName)}` : ""}`;
  const tweet = twitterShareUrl(text, url);

  return (
    <div className="luxury-card p-5">
      <p className="kb-eyebrow">Share your progress</p>
      <h3 className="font-display mt-1 text-[16px] font-semibold">Level up card</h3>
      <p className="mt-2 text-[13px] text-muted">{text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={tweet}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white hover:brightness-110"
        >
          Share on X
        </a>
        <Link
          href={og}
          target="_blank"
          className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent"
        >
          Preview OG image
        </Link>
        {roomSlug && (
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold hover:border-accent"
            onClick={() => navigator.clipboard.writeText(url)}
          >
            Copy invite link
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Invite link adds <code>?keeper=</code> so visits attribute to you in the follow feed.
      </p>
    </div>
  );
}
