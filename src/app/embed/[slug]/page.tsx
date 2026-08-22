import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/listing-page";
import { formatMoney } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Minimal iframe-friendly badge — fixed height so footer stays hidden in widget. */
export default async function EmbedPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <div className="flex h-[72px] items-center justify-center bg-[#fefaf6] px-4">
      <a
        href={`${siteUrl()}/l/${listing.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-[#f0cfc3] bg-white px-4 py-2 text-[13px] font-semibold text-[#1c1917] shadow-sm hover:border-[#e55b3c] no-underline"
      >
        <span className="text-[#e55b3c]">#{listing.rank}</span>
        <span>on kingbid</span>
        <span className="text-muted">·</span>
        <span className="tabular text-[#e55b3c]">{formatMoney(listing.currentBid)}</span>
      </a>
    </div>
  );
}
