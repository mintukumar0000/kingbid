"use client";

import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";

export function FollowFounderButton({ userId, isSelf }: { userId: string; isSelf?: boolean }) {
  const { data, mutate } = useSWR<{ following: boolean }>(
    isSelf ? null : `/api/founders/${encodeURIComponent(userId)}/follow`,
    fetcher
  );
  const [loading, setLoading] = useState(false);

  if (isSelf) {
    return (
      <p className="mt-4 text-[13px] text-muted">
        This is your profile — share the link so others can follow you.
      </p>
    );
  }

  async function toggle() {
    setLoading(true);
    await fetch(`/api/founders/${encodeURIComponent(userId)}/follow`, {
      method: data?.following ? "DELETE" : "POST",
      credentials: "include",
    });
    setLoading(false);
    mutate();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`mt-4 rounded-full border px-5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
        data?.following
          ? "border-accent bg-accent-soft text-accent"
          : "border-border hover:border-accent"
      }`}
    >
      {data?.following ? "Following" : "Follow founder"}
    </button>
  );
}
