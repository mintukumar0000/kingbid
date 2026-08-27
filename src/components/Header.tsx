"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { PAGE_WIDE } from "@/lib/layout";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 14.3A9 9 0 1 1 9.7 3a7 7 0 0 0 11.3 11.3z" />
        </svg>
      )}
    </button>
  );
}

export function Header() {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/#.*$/, ""));
    return (
      <Link
        href={href}
        className={`text-[14px] transition-colors ${
          active ? "font-medium text-foreground" : "font-normal text-muted hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
      <div className={`${PAGE_WIDE} flex h-[56px] items-center justify-between gap-4`}>
        <Link href="/" className="shrink-0 text-[18px] font-semibold tracking-tight text-foreground">
          kingbid
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {link("/#live-crowns", "Crowns")}
          {link("/#live-crowns", "Trending")}
          {link("/#kingdom", "Kingdom")}
          {link("/rules", "Rules")}
          {link("/about", "About")}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/#live-crowns"
            className="hidden rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 sm:inline-block"
          >
            Claim a crown
          </Link>
        </div>
      </div>
    </header>
  );
}
