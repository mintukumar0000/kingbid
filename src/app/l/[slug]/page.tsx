import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { RankHistoryChart } from "@/components/RankHistoryChart";
import { ShareButtons } from "@/components/ShareButtons";
import { getListingBySlug, getRankHistory } from "@/lib/listing-page";
import { getListingSacrifice } from "@/lib/underdog";
import { formatMoney } from "@/lib/format";
import { REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";
import { BRAND_LABEL, SITE_NAME } from "@/lib/brand";
import { ogClaimUrl } from "@/lib/site";
import { RelativeTime } from "@/components/RelativeTime";
import { BadgeEmbedSnippet } from "@/components/BadgeEmbedSnippet";
import { FounderToolsPanel } from "@/components/FounderToolsPanel";
import { StartBattlePanel } from "@/components/StartBattlePanel";
import { PAGE } from "@/lib/layout";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Listing not found" };

  const title = `${listing.displayUrl} — #${listing.rank} on ${BRAND_LABEL} (${formatMoney(listing.currentBid)})`;
  const og = ogClaimUrl(listing.rank, listing.currentBid, listing.displayUrl);
  return {
    title,
    description: listing.description || `${listing.displayUrl} on the pay-to-rank leaderboard.`,
    openGraph: { title, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const history = await getRankHistory(listing.id);
  const sacrifice = await getListingSacrifice(listing.id, listing.boardId);
  const shareText = `${listing.displayUrl} is #${listing.rank} on ${SITE_NAME} with a ${formatMoney(listing.currentBid)} bid. Think you can take our spot?`;
  const clickUrl = `/go/${listing.id}`;

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <div className="rounded-[20px] border border-[#f0cfc3] bg-peach p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-accent">#{listing.rank} on {BRAND_LABEL}</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{listing.displayUrl}</h1>
              <p className="mt-1 text-muted">{listing.title}</p>
            </div>
            <p className="tabular text-3xl font-bold text-accent sm:text-4xl">
              {formatMoney(listing.currentBid)}
            </p>
          </div>
          {listing.description && (
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{listing.description}</p>
          )}
          <p className="mt-3 text-[13px] text-muted">
            <RelativeTime date={listing.lastBidAt} /> · {listing.clickCount.toLocaleString()} clicks
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={clickUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            >
              Visit site →
            </a>
            <Link
              href={`/stats/${listing.id}`}
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Click stats
            </Link>
            <Link
              href={`/?claim=${encodeURIComponent(listing.slug)}&amount=${listing.claimPrice}`}
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Claim this spot for {formatMoney(listing.claimPrice)}
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h2 className="text-[15px] font-semibold">Bid history</h2>
          <div className="mt-4">
            <RankHistoryChart history={history} />
          </div>
        </section>

        {(sacrifice || listing.revenueBand) && (
          <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">🐕 Underdog</p>
            <h2 className="mt-1 text-[15px] font-semibold">Sacrifice score</h2>
            {listing.revenueBand ? (
              <>
                <p className="mt-2 text-[13px] text-muted">
                  Band: {REVENUE_BAND_LABELS[listing.revenueBand as RevenueBand] ?? listing.revenueBand}
                  {sacrifice?.revenueVerified ? (
                    <span className="ml-1 text-green">✓ verified</span>
                  ) : (
                    <span className="ml-1">(self-reported)</span>
                  )}
                </p>
                {sacrifice ? (
                  <p className="mt-2 font-mono-label text-[28px] font-semibold text-accent">
                    {sacrifice.sacrificeScore.toFixed(2)}× conviction
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-muted">Score updates after your next bid.</p>
                )}
                <Link href="/underdogs" className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline">
                  See full Underdog Row →
                </Link>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-muted">
                Pick a revenue band when claiming to join the Underdog Row — separate from money rank.
              </p>
            )}
          </section>
        )}

        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h2 className="text-[15px] font-semibold">Share & earn referral credit</h2>
          <p className="mt-2 text-[13px] text-muted">
            Share with <code className="text-accent">?ref={listing.slug}</code> — earn $1 off your
            next raise when someone bids via your link.
          </p>
          <div className="mt-4">
            <ShareButtons text={shareText} slug={listing.slug} />
          </div>
        </section>

        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">⚔️ Live Battles</p>
          <h2 className="mt-1 text-[15px] font-semibold">Start a battle</h2>
          <p className="mt-1 text-[13px] text-muted">
            Pick a rival — goes live on the homepage once both sides confirm.
          </p>
          <div className="mt-4">
            <StartBattlePanel listingId={listing.id} slug={listing.slug} displayUrl={listing.displayUrl} />
          </div>
        </section>

        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h2 className="text-[15px] font-semibold">Founder tools</h2>
          <p className="mt-1 text-[13px] text-muted">
            Underdog rank, rivals, Call It predictions, migration badge — reputation features only.
          </p>
          <div className="mt-4">
            <FounderToolsPanel
              listingId={listing.id}
              boardId={listing.boardId}
              slug={listing.slug}
              revenueBand={listing.revenueBand}
            />
          </div>
        </section>

        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h2 className="text-[15px] font-semibold">Embed badge</h2>
          <p className="mt-2 text-[13px] text-muted">
            Paste on your site — rank updates every 5 minutes from live board data.
          </p>
          <div className="mt-3">
            <BadgeEmbedSnippet listingId={listing.id} slug={listing.slug} />
          </div>
          <p className="mt-3 text-[13px]">
            <Link href={`/embed/${listing.slug}`} className="text-accent hover:underline">
              Preview embed →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
