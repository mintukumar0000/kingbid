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
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Category rooms
          </p>
          <h2 className="mt-1.5 text-[22px] font-bold tracking-tight text-foreground sm:text-[26px]">
            Private squares. Invite to enter.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-muted">
            Each category is its own room. Founders join with a personal claim link — never pre-listed
            without consent.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
      className={`room-square group relative flex min-h-[168px] w-full flex-col overflow-hidden rounded-[20px] border-2 bg-surface text-left transition-all duration-300 sm:min-h-[190px] md:aspect-square md:min-h-0 ${
        active
          ? "border-accent shadow-[0_0_0_1px_var(--accent),0_16px_48px_rgba(229,91,60,0.18)]"
          : "border-border shadow-[var(--shadow)] hover:-translate-y-0.5 hover:border-[#f0cfc3] hover:shadow-[0_12px_36px_rgba(229,91,60,0.12)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{
          background: "linear-gradient(145deg, #fff5f2 0%, #ffffff 50%, #fff9f7 100%)",
        }}
        aria-hidden
      />

      <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-accent/45 sm:h-5 sm:w-5" aria-hidden />
      <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-accent/45 sm:h-5 sm:w-5" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-accent/45 sm:h-5 sm:w-5" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-accent/45 sm:h-5 sm:w-5" aria-hidden />

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#f0cfc3] bg-peach text-[18px] font-semibold text-accent sm:h-12 sm:w-12"
            aria-hidden
          >
            {theme?.icon ?? "◆"}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              empty
                ? "border-border bg-surface-2 text-muted"
                : "border-[#f0cfc3] bg-peach text-accent"
            }`}
          >
            {empty ? "Open" : "Live"}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <p className="line-clamp-2 text-[14px] font-bold leading-snug text-foreground sm:text-[15px]">
            {shortCategoryName(cat.slug, cat.name)}
          </p>
          <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-accent sm:text-[12px]">
            {theme?.roomLabel}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/80 pt-3">
            <span className="tabular text-[12px] font-medium text-muted">
              {cat.listingCount === 0 ? "0 inside" : `${cat.listingCount} inside`}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent sm:text-[12px]">
              Enter
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {cat.isMeta && (
        <span className="absolute right-14 top-4 rounded-md bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:right-16">
          Meta
        </span>
      )}
    </button>
  );
}
