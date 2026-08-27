import Link from "next/link";
import { FOUNDER_HANDLE, FOUNDER_X_URL } from "@/lib/brand";
import { PAGE_WIDE } from "@/lib/layout";

export function Footer() {
  const handle = FOUNDER_HANDLE.replace(/^@/, "");

  return (
    <footer className="site-footer mt-auto">
      <div className={`${PAGE_WIDE} py-12`}>
        <div className="site-footer-grid">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-display text-[22px] font-bold tracking-tight">
              <span className="site-footer-crown" aria-hidden>
                👑
              </span>
              KING<span className="text-[var(--crown-gold)]">BID</span>
            </Link>
            <p className="mt-2 text-[14px] text-muted">WHO&apos;S KING? Bid. Reign. Repeat.</p>
          </div>

          <nav className="site-footer-nav">
            <Link href="/#live-crowns">Crowns</Link>
            <Link href="/#kingdom">Kingdom</Link>
            <Link href="/rules">Rules</Link>
            <Link href="/about">About</Link>
          </nav>

          <div className="site-footer-meta">
            <p>
              Built by{" "}
              <a href={FOUNDER_X_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--crown-gold)] hover:underline">
                @{handle}
              </a>
            </p>
            <p className="mt-1 text-[11px] text-muted/80">Fictional digital titles only · Not affiliated with any government or platform</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
