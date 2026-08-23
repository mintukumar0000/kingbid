import Link from "next/link";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptions";
import { StatsBar } from "@/components/StatsBar";
import { PricingCheckoutButtons } from "@/components/PricingCheckoutButtons";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

export default function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  return <PricingPageInner searchParams={searchParams} />;
}

async function PricingPageInner({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { subscribed } = await searchParams;
  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-12`}>
      <h1 className="text-2xl font-bold tracking-tight">Pricing</h1>
      <p className="mt-2 text-[15px] text-muted">
        Rank is always pay-to-rank. Pro tiers add analytics and tools — they never buy placement on the
        board.
      </p>

      <div className="mt-6 flex justify-center">
        <StatsBar />
      </div>

      {subscribed && (
        <p className="mt-6 rounded-xl border border-green/30 bg-green/5 px-4 py-3 text-center text-[13px] text-green">
          Payment received — {SUBSCRIPTION_TIERS[subscribed as keyof typeof SUBSCRIPTION_TIERS]?.label ?? "Pro"}{" "}
          activates once Dodo webhook confirms (usually under a minute).
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-bold">$0</p>
          <ul className="mt-4 space-y-2 text-[13px] text-muted">
            <li>Listing on the board</li>
            <li>Basic profile</li>
            <li>Underdog sacrifice score (self-reported band)</li>
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-accent bg-surface p-5">
          <h2 className="font-semibold">{SUBSCRIPTION_TIERS.founder_pro.label}</h2>
          <p className="mt-1 text-2xl font-bold">${SUBSCRIPTION_TIERS.founder_pro.price}/mo</p>
          <ul className="mt-4 space-y-2 text-[13px] text-muted">
            <li>Analytics & historical charts</li>
            <li>Competitor / rival tracking</li>
            <li>Advanced alerts</li>
          </ul>
          <p className="mt-4 text-[12px] text-muted">Paid via Dodo — same provider as board bids.</p>
          <PricingCheckoutButtons tier="founder_pro" />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">{SUBSCRIPTION_TIERS.room_pro.label}</h2>
          <p className="mt-1 text-2xl font-bold">${SUBSCRIPTION_TIERS.room_pro.price}/mo</p>
          <ul className="mt-4 space-y-2 text-[13px] text-muted">
            <li>Room analytics</li>
            <li>Keeper member tools</li>
            <li>Custom room branding</li>
          </ul>
          <p className="mt-4 text-[12px] text-muted">Paid via Dodo — same provider as board bids.</p>
          <PricingCheckoutButtons tier="room_pro" />
        </div>
      </div>

      <p className="mt-8 text-[13px] text-muted">
        Sponsored rooms and featured launches are separate from rank — always labeled as paid placement.{" "}
        <Link href="/rules" className="font-medium text-foreground hover:underline">
          Read the rules →
        </Link>{" "}
        ·{" "}
        <Link href="/verify" className="font-medium text-foreground hover:underline">
          Verification checklist →
        </Link>
      </p>
      </div>
    </main>
  );
}
