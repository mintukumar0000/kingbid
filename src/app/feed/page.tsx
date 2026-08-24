"use client";

import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { fetcher } from "@/lib/fetcher";
import { PAGE } from "@/lib/layout";
import { RelativeTime } from "@/components/RelativeTime";

type FeedPayload = {
  followedRooms: { id: string; slug: string; name: string; enterUrl: string }[];
  followedFounders: { id: string; handle: string; profileUrl: string }[];
  feed: {
    type: string;
    at: string;
    headline: string;
    listingSlug?: string;
    profileUrl?: string;
  }[];
};

export default function FeedPage() {
  const { data } = useSWR<FeedPayload>("/api/feed", fetcher, { refreshInterval: 20_000 });

  const followingCount = (data?.followedRooms.length ?? 0) + (data?.followedFounders.length ?? 0);

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <p className="kb-eyebrow">Your network</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold">Follow feed</h1>
        <p className="mt-2 text-[14px] text-muted">Activity from rooms and founders you follow.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="luxury-card p-5 lg:col-span-2">
            <h2 className="font-display text-[16px] font-semibold">Recent activity</h2>
            {!data ? (
              <p className="mt-3 text-[13px] text-muted">Loading…</p>
            ) : !data.feed.length && followingCount === 0 ? (
              <p className="mt-3 text-[13px] text-muted">
                Follow a room on{" "}
                <Link href="/rooms" className="text-accent hover:underline">
                  /rooms
                </Link>{" "}
                or a keeper on their profile — activity shows up here.
              </p>
            ) : !data.feed.length ? (
              <div className="mt-3 space-y-2 text-[13px] text-muted">
                <p>
                  You&apos;re following {data.followedRooms.length} room
                  {data.followedRooms.length === 1 ? "" : "s"}
                  {data.followedFounders.length > 0
                    ? ` and ${data.followedFounders.length} founder${data.followedFounders.length === 1 ? "" : "s"}`
                    : ""}
                  .
                </p>
                <p>Live events appear when founders bid, take the crown, or keepers pin products / run weekly events.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.feed.map((item, i) => (
                  <li key={`${item.at}-${i}`} className="flex items-start justify-between gap-3 text-[13px]">
                    <span>{item.headline}</span>
                    <RelativeTime date={item.at} className="shrink-0 text-[11px] text-muted" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-4">
            <section className="luxury-card p-5">
              <h2 className="text-[14px] font-semibold">Rooms you follow</h2>
              {!data?.followedRooms.length ? (
                <p className="mt-2 text-[12px] text-muted">
                  <Link href="/rooms" className="text-accent hover:underline">
                    Browse rooms →
                  </Link>
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-[13px]">
                  {data.followedRooms.map((r) => (
                    <li key={r.id}>
                      <Link href={r.enterUrl} className="hover:text-accent">
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="luxury-card p-5">
              <h2 className="text-[14px] font-semibold">Founders you follow</h2>
              {!data?.followedFounders.length ? (
                <p className="mt-2 text-[12px] text-muted">Follow keepers from their profile page.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-[13px]">
                  {data.followedFounders.map((f) => (
                    <li key={f.id}>
                      <Link href={f.profileUrl} className="hover:text-accent">
                        @{f.handle}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
