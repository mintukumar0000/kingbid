import Link from "next/link";
import { FOUNDER_HANDLE, FOUNDER_X_URL } from "@/lib/brand";
import { PAGE_WIDE } from "@/lib/layout";
import { CROWN_DISCLAIMER } from "@/lib/crowns";

export function Footer() {
  const handle = FOUNDER_HANDLE.replace(/^@/, "");

  return (
    <footer className="mt-auto border-t border-border">
      <div className={`${PAGE_WIDE} py-10 text-center`}>
        <p className="text-2xl">👑</p>
        <p className="font-display mt-2 text-[18px] font-semibold">
          KING<span className="text-[var(--crown-gold)]">BID</span>
        </p>
        <p className="mt-1 text-[13px] font-medium text-muted">WHO&apos;S KING?</p>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[13px]">
          <Link href="/#live-crowns" className="text-muted hover:text-[var(--crown-gold)]">
            Crowns
          </Link>
          <Link href="/rules" className="text-muted hover:text-[var(--crown-gold)]">
            Rules
          </Link>
          <Link href="/about" className="text-muted hover:text-[var(--crown-gold)]">
            About
          </Link>
        </nav>
        <p className="mx-auto mt-6 max-w-lg text-[11px] leading-relaxed text-muted/80">{CROWN_DISCLAIMER}</p>
        <p className="mt-4 text-[12px] text-muted">
          Built by{" "}
          <a href={FOUNDER_X_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--crown-gold)] hover:underline">
            @{handle}
          </a>
        </p>
      </div>
    </footer>
  );
}
