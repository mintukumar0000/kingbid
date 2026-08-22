import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { RankHistoryChart } from "@/components/RankHistoryChart";
import { ShareButtons } from "@/components/ShareButtons";
import { getListingBySlug, getRankHistory } from "@/lib/listing-page";
import { formatMoney, outboundUrl } from "@/lib/format";
import { BRAND_LABEL, SITE_NAME } from "@/lib/brand";
import { ogClaimUrl, siteUrl } from "@/lib/site";
import { RelativeTime } from "@/components/RelativeTime";
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
  const shareText = `${listing.displayUrl} is #${listing.rank} on ${SITE_NAME} with a ${formatMoney(listing.currentBid)} bid. Think you can take our spot?`;
  const embedCode = `<script src="${siteUrl()}/widget.js" data-slug="${listing.slug}"></script>`;

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
              href={outboundUrl(listing.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            >
              Visit site →
            </a>
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
          <h2 className="text-[15px] font-semibold">Embed badge</h2>
          <p className="mt-2 text-[13px] text-muted">
            Paste on your site — updates live from the leaderboard.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] text-muted">
            {embedCode}
          </pre>
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
