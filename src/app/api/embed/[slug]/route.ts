import { NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/listing-page";

export const dynamic = "force-dynamic";

/** JSON for embed widget / third-party integrations. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      slug: listing.slug,
      displayUrl: listing.displayUrl,
      title: listing.title,
      rank: listing.rank,
      currentBid: listing.currentBid,
      clickCount: listing.clickCount,
      url: listing.url,
      claimPrice: listing.claimPrice,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
