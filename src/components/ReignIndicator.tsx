"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";

export function ReignIndicator({ listingId, rank }: { listingId: string; rank: number }) {
  const { data } = useSWR<{ duration: string | null }>(
    rank === 1 ? `/api/reign/${listingId}` : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  if (rank !== 1 || !data?.duration) return null;

  return (
    <Link
      href="/history/global"
      className="text-[11px] font-medium text-gold hover:underline"
      data-no-row-nav
    >
      🏆 holding #1 for {data.duration}
    </Link>
  );
}
