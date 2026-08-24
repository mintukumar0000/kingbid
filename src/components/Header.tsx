"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HashLink } from "@/components/HashLink";
import { PAGE_WIDE } from "@/lib/layout";

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const path = href.split("#")[0] || "/";
    if (path === "/") return pathname === "/" && !href.includes("#");
    return pathname === path || pathname.startsWith(path + "/");
  };

  const link = (href: string, label: string, useHash = false) => {
    const path = href.split("#")[0] || "/";
    const active = isActive(href);
    const cls = `hidden sm:inline transition-colors ${
      active ? "font-semibold text-foreground" : "font-normal text-muted hover:text-foreground"
    }`;
    if (useHash) {
      return (
        <HashLink href={href} className={cls}>
          {label}
        </HashLink>
      );
    }
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className={`${PAGE_WIDE} flex h-[58px] items-center justify-between`}>
        <Link href="/" className="font-display text-[22px] font-bold tracking-[0.3px] text-foreground">
          KING<span className="text-accent">BID</span>
        </Link>

        <nav className="flex items-center gap-4 text-[14px] sm:gap-6">
          {link("/rooms", "Rooms")}
          {link("/#underdogs", "Underdogs", true)}
          {link("/founders", "Kingmakers")}
          {link("/feed", "Feed")}
          {link("/#history", "History", true)}
          {link("/pricing", "Pricing")}
          <HashLink
            href="/#claim"
            className="hidden rounded-full bg-accent px-5 py-2 text-[13.5px] font-semibold text-white hover:brightness-110 sm:inline"
          >
            Claim a room
          </HashLink>
        </nav>
      </div>
    </header>
  );
}
