"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { getCategoryRoomTheme, shortCategoryName } from "@/lib/category-rooms";

type Category = {
  id: string;
  slug: string;
  name: string;
  boardId: string | null;
  listingCount: number;
  isMeta: boolean;
};

interface Props {
  activeSlug: string | null;
  onEnter: (slug: string) => void;
  compact?: boolean;
}

/** Square room tiles — browse and enter category boards. */
export function CategoryRoomGrid({ activeSlug, onEnter, compact }: Props) {
  const { data } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);
  const categories = data?.categories ?? [];

  if (categories.length === 0) return null;

  return (
    <section className={compact ? "" : "mt-2"}>
      {!compact && (
        <div className="mb-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Category rooms
          </p>
          <h2 className="mt-1.5 text-[20px] font-bold tracking-tight text-foreground sm:text-[22px]">
            Private squares. Invite to enter.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            Each category is its own room. Founders join with a personal claim link — never pre-listed
            without consent.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((cat) => (
          <RoomSquare
            key={cat.slug}
            cat={cat}
            active={activeSlug === cat.slug}
            onEnter={() => onEnter(cat.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function RoomSquare({
  cat,
  active,
  onEnter,
}: {
  cat: Category;
  active: boolean;
  onEnter: () => void;
}) {
  const theme = getCategoryRoomTheme(cat.slug);
  const empty = cat.listingCount === 0;

  return (
    <button
      type="button"
      onClick={onEnter}
      className={`room-square group relative flex aspect-square w-full flex-col overflow-hidden rounded-[18px] border-2 bg-surface text-left transition-all duration-300 ${
        active
          ? "border-accent shadow-[0_0_0_1px_var(--accent),0_12px_40px_rgba(229,91,60,0.15)]"
          : "border-border shadow-[var(--shadow)] hover:border-[#f0cfc3] hover:shadow-[0_8px_28px_rgba(229,91,60,0.1)]"
      }`}
    >
      {/* Inner peach wash */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{
          background: "linear-gradient(145deg, #fff5f2 0%, #ffffff 55%, #fff9f7 100%)",
        }}
        aria-hidden
      />

      {/* Corner accents — luxury frame */}
      <span className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 border-l-2 border-t-2 border-accent/40" aria-hidden />
      <span className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 border-r-2 border-t-2 border-accent/40" aria-hidden />
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 border-b-2 border-l-2 border-accent/40" aria-hidden />
      <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 border-b-2 border-r-2 border-accent/40" aria-hidden />

      <div className="relative flex h-full flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#f0cfc3] bg-peach text-[15px] font-semibold text-accent"
            aria-hidden
          >
            {theme?.icon ?? "◆"}
          </span>
          <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
            {empty ? "Open" : "Live"}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground sm:text-[14px]">
            {shortCategoryName(cat.name)}
          </p>
          <p className="mt-1 line-clamp-1 text-[10px] text-muted sm:text-[11px]">
            {theme?.roomLabel}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-border/80 pt-2.5">
            <span className="tabular text-[11px] font-medium text-muted">
              {cat.listingCount === 0 ? "0 inside" : `${cat.listingCount} inside`}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-accent">
              Enter
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {cat.isMeta && (
        <span className="absolute right-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
          Meta
        </span>
      )}
    </button>
  );
}
