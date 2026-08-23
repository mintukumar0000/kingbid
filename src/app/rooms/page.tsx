"use client";

import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { fetcher } from "@/lib/fetcher";
import { PAGE } from "@/lib/layout";
import { getCategoryRoomTheme } from "@/lib/category-rooms";

export default function RoomsIndexPage() {
  const { data } = useSWR<{ rooms: { slug: string; name: string; description: string; listingCount: number; keeperCount: number; enterUrl: string; categorySlug: string | null }[] }>(
    "/api/rooms?sync=1",
    fetcher
  );

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
            <p className="mt-2 text-[15px] text-muted">
              Pick a category room — bid, climb ranks, earn keeper status.
            </p>
          </div>
          <Link
            href="/rooms/request"
            className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110"
          >
            + Request a room
          </Link>
        </div>

        <p className="mt-4 text-[13px]">
          <Link href="/founders" className="text-accent hover:underline">
            Founder Hub →
          </Link>{" "}
          for Discovery bets, rivals, and keeper levels.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.rooms.map((room) => {
            const theme = room.categorySlug ? getCategoryRoomTheme(room.categorySlug) : null;
            return (
              <Link
                key={room.slug}
                href={room.enterUrl}
                className="group rounded-2xl border border-border bg-surface p-4 hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  {theme && <span className="text-2xl">{theme.icon}</span>}
                  <div>
                    <p className="font-semibold group-hover:text-accent">{room.name}</p>
                    <p className="mt-1 text-[12px] text-muted line-clamp-2">{room.description || theme?.motto}</p>
                    <p className="mt-2 text-[11px] text-muted">
                      {room.listingCount} listings · {room.keeperCount} keepers
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!data && <p className="mt-8 text-[13px] text-muted">Loading rooms…</p>}
      </div>
    </main>
  );
}
