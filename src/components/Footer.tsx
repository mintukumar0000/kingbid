import Link from "next/link";
import { FOUNDER_HANDLE, FOUNDER_X_URL } from "@/lib/brand";
import { PAGE_WIDE } from "@/lib/layout";
import { isCampaignUiEnabled } from "@/lib/nepal-campaign-config";

export function Footer() {
  const handle = FOUNDER_HANDLE.replace(/^@/, "");
  const showNepal = isCampaignUiEnabled();

  return (
    <footer className="mt-20 border-t border-border">
      {showNepal && (
        <div className="border-b border-border bg-surface-2/50 py-8">
          <div className={`${PAGE_WIDE}`}>
            <p className="font-semibold text-foreground">🇳🇵 Nepal Flood Relief Campaign</p>
            <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
              <Link href="/nepal-relief" className="text-accent hover:underline">
                Campaign details
              </Link>
              <Link href="/nepal-relief" className="text-accent hover:underline">
                Financial transparency
              </Link>
              <Link href="/nepal-relief#ledger" className="text-accent hover:underline">
                Payment ledger
              </Link>
              <Link href="/nepal-relief#donations" className="text-accent hover:underline">
                Donation records
              </Link>
              <Link href="/nepal-relief#rules" className="text-accent hover:underline">
                Campaign rules
              </Link>
              <a href="mailto:heyquixy@gmail.com" className="text-accent hover:underline">
                Contact
              </a>
            </nav>
            <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-muted">
              Kingbid is not a charity. This is a temporary fundraising campaign operated through Kingbid. Payments are
              processed by Dodo Payments, and eligible campaign proceeds are transferred to the designated relief
              organization after settlement.
            </p>
          </div>
        </div>
      )}
      <div
        className={`${PAGE_WIDE} flex flex-col items-center justify-center gap-2 py-8 text-[13px] text-muted sm:flex-row sm:gap-3`}
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
