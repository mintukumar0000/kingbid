"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { BoardScope } from "@/lib/geo";
import { getCategoryRoomTheme } from "@/lib/category-rooms";

type Category = {
  id: string;
  slug: string;
  name: string;
  boardId: string | null;
  listingCount: number;
  isMeta: boolean;
};

interface Props {
  scope: BoardScope;
  categorySlug: string | null;
  onScopeChange: (scope: BoardScope) => void;
  onCategoryChange: (slug: string | null) => void;
}

export function CategoryBoardTabs({ scope, categorySlug, onScopeChange, onCategoryChange }: Props) {
  const { data } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);

  function selectGlobal() {
    onScopeChange("global");
    onCategoryChange(null);
  }

  function selectLocal() {
    onScopeChange("local");
    onCategoryChange(null);
  }

  function selectCategory(slug: string) {
    onScopeChange("global");
    onCategoryChange(slug);
  }

  return (
    <div className="w-full max-w-4xl px-2">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Choose your board
      </p>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tab active={scope === "global" && !categorySlug} onClick={selectGlobal} variant="default">
          🌐 Global
        </Tab>
        <Tab active={scope === "local" && !categorySlug} onClick={selectLocal} variant="default">
          📍 Local
        </Tab>
        {(data?.categories ?? []).map((cat) => {
          const room = getCategoryRoomTheme(cat.slug);
          return (
            <Tab
              key={cat.slug}
              active={categorySlug === cat.slug}
              onClick={() => selectCategory(cat.slug)}
              variant="category"
            >
              <span aria-hidden>{room?.icon ?? "◆"}</span>
              <span className="max-w-[120px] truncate sm:max-w-none">{cat.name}</span>
              {cat.listingCount > 0 && (
                <span className="tabular ml-0.5 opacity-70">({cat.listingCount})</span>
              )}
            </Tab>
          );
        })}
      </div>
    </div>
  );
}

function Tab({
  children,
  active,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant: "default" | "category";
}) {
  const isCategory = variant === "category";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`category-room-tab shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium sm:text-[12px] ${
        active
          ? isCategory
            ? "category-room-tab-active category-room-tab-category border-[#c9a962] bg-[#1a1512] text-[#f5efe6]"
            : "category-room-tab-active border-accent bg-accent text-white"
          : isCategory
            ? "border-border/80 bg-surface text-foreground hover:border-[#c9a962]/50 hover:bg-[#1a1512]/5"
            : "border-border bg-surface text-foreground hover:border-accent/60"
      }`}
    >
      {children}
    </button>
  );
}
