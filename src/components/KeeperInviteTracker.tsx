"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { keeperRefCookieName } from "@/lib/viral";

/** Track ?keeper=userId on room URLs — attributes visits to inviter. */
export function KeeperInviteTracker({ roomSlug }: { roomSlug: string }) {
  const params = useSearchParams();
  const keeper = params.get("keeper");

  useEffect(() => {
    if (!keeper?.trim() || !roomSlug) return;
    const name = keeperRefCookieName();
    document.cookie = `${name}=${encodeURIComponent(keeper.trim())};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
    fetch("/api/keeper-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inviterUserId: keeper.trim(), roomSlug }),
    }).catch(() => undefined);
  }, [keeper, roomSlug]);

  return null;
}
