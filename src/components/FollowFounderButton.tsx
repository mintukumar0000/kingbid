"use client";

import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";

export function FollowFounderButton({ userId }: { userId: string }) {
  const { data, mutate } = useSWR<{ following: boolean }>(
    `/api/founders/${encodeURIComponent(userId)}/follow`,
    fetcher
  );
  const [loading, setLoading] = useState(false);

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
