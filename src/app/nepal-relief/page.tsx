import { Header } from "@/components/Header";
import { NepalReliefPageContent } from "@/components/nepal/NepalReliefPageContent";
import { PAGE_WIDE } from "@/lib/layout";

export const dynamic = "force-dynamic";

export default function NepalReliefPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE_WIDE} py-10`}>
        <p className="kb-eyebrow">Financial transparency</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold sm:text-[40px]">🇳🇵 Kingbid for Nepal</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
          Turning leaderboard bids into flood relief. Live financial transparency from payment to donation.
        </p>
        <div className="mt-8">
          <NepalReliefPageContent />
        </div>
      </div>
    </main>
  );
}
