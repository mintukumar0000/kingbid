import Link from "next/link";
import { PAGE } from "@/lib/layout";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className={`${PAGE} flex flex-col items-center justify-between gap-3 py-8 text-[13px] text-muted sm:flex-row`}>
        <p>
          Built as an open pay-to-rank board. Rank is for sale — literally.
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/" className="text-accent hover:underline">
            Leaderboard
          </Link>
          <Link href="/rules" className="text-accent hover:underline">
            Rules
          </Link>
          <Link href="/stats" className="text-accent hover:underline">
            Live stats
          </Link>
        </nav>
      </div>
    </footer>
  );
}
