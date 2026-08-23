"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { BoardScope } from "@/lib/geo";

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
    <div className="flex max-w-full gap-2 overflow-x-auto px-2 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Tab active={scope === "global" && !categorySlug} onClick={selectGlobal}>
        Global
      </Tab>
      <Tab active={scope === "local" && !categorySlug} onClick={selectLocal}>
        Local
      </Tab>
      {(data?.categories ?? []).map((cat) => (
        <Tab
          key={cat.slug}
          active={categorySlug === cat.slug}
          onClick={() => selectCategory(cat.slug)}
        >
          {cat.name}
          {cat.listingCount > 0 ? ` (${cat.listingCount})` : ""}
        </Tab>
      ))}
    </div>
  );
}

function Tab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-foreground hover:border-accent/60"
      }`}
    >
      {children}
    </button>
  );
}
