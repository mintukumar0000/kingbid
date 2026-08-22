import Link from "next/link";
import { FOUNDER_HANDLE, FOUNDER_X_URL } from "@/lib/brand";
import { PAGE } from "@/lib/layout";

export function Footer() {
  const handle = FOUNDER_HANDLE.replace(/^@/, "");

  return (
    <footer className="mt-20 border-t border-border">
      <div
        className={`${PAGE} flex flex-col items-center justify-center gap-2 py-8 text-[13px] text-muted sm:flex-row sm:gap-3`}
      >
        <p>
          Built by{" "}
          <a
            href={FOUNDER_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            @{handle}
          </a>
        </p>
        <span className="hidden text-muted/40 sm:inline">·</span>
        <nav className="flex items-center gap-3">
          <Link href="/rules" className="text-accent hover:underline">
            Rules
          </Link>
          <span className="text-muted/40">·</span>
          <Link href="/stats" className="text-accent hover:underline">
            Live stats
          </Link>
        </nav>
      </div>
    </footer>
  );
}
