"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_WIDE } from "@/lib/layout";

export function Header() {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`hidden sm:inline text-[14px] transition-colors ${
          active ? "font-semibold text-[var(--crown-gold)]" : "font-normal text-muted hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`${PAGE_WIDE} flex h-[58px] items-center justify-between gap-4`}>
        <Link href="/" className="font-display shrink-0 text-[20px] font-bold tracking-[0.3px] text-foreground">
          👑 KING<span className="text-[var(--crown-gold)]">BID</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-5">
          {link("/#live-crowns", "Crowns")}
          {link("/#live-crowns", "Trending")}
          {link("/#kingdom", "Kingdom")}
          {link("/rules", "Rules")}
          <Link
            href="/#live-crowns"
            className="rounded-full bg-[var(--crown-gold)] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#0a0908] hover:brightness-110"
          >
            Claim a Crown
          </Link>
        </nav>
      </div>
    </header>
  );
}
