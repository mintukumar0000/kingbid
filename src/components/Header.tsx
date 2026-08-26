"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_WIDE } from "@/lib/layout";

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const link = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`hidden sm:inline transition-colors ${
          active ? "font-semibold text-foreground" : "font-normal text-muted hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className={`${PAGE_WIDE} flex h-[58px] items-center justify-between gap-4`}>
        <Link href="/" className="font-display shrink-0 text-[22px] font-bold tracking-[0.3px] text-foreground">
          KING<span className="text-accent">BID</span>
        </Link>

        <nav className="flex items-center gap-4 text-[14px] sm:gap-5">
          {link("/", "Leaderboard")}
          {link("/rules", "Rules")}
          {link("/about", "About")}
          <Link
            href="/nepal-relief"
            className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors sm:inline ${
              isActive("/nepal-relief")
                ? "border-accent bg-accent text-white"
                : "border-border text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            View live transparency
          </Link>
        </nav>
      </div>
    </header>
  );
}
