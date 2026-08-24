"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";

export function RowOfKings() {
  const { data } = useSWR<{
    kings: {
      kind: string;
      emoji: string;
      title: string;
      slug: string;
      displayUrl: string;
      stat: string;
      statLabel: string;
      href: string;
    }[];
  }>("/api/kings", fetcher, { refreshInterval: 30_000 });

  if (!data?.kings.length) {
    return (
      <p className="text-[13px] text-muted">
        Row of Kings fills as founders bid, claim revenue bands, and gain traction.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {data.kings.map((k) => (
        <Link
          key={k.kind}
          href={k.href}
          className="luxury-card block p-4 transition-colors hover:border-accent"
        >
          <p className="text-[20px]" aria-hidden>
            {k.emoji}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{k.title}</p>
          <p className="mt-1 truncate font-medium">{k.displayUrl}</p>
          <p className="font-mono-label mt-2 text-[15px] font-semibold text-accent">{k.stat}</p>
          <p className="text-[10px] text-muted">{k.statLabel}</p>
        </Link>
      ))}
    </div>
  );
}
