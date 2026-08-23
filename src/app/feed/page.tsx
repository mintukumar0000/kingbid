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
            {!data?.feed.length ? (
              <p className="mt-3 text-[13px] text-muted">
                Follow a room or founder to see activity here.
              </p>
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
              <h2 className="text-[14px] font-semibold">Rooms</h2>
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
              <h2 className="text-[14px] font-semibold">Founders</h2>
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
