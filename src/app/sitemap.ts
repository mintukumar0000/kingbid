import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** All indexable URLs for Google Search Console. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().replace(/\/$/, "");

  const listings = await prisma.listing.findMany({
    where: { currentBid: { gt: 0 } },
    select: { slug: true, updatedAt: true, lastBidAt: true },
    orderBy: { lastBidAt: "desc" },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/rules`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/stats`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.5,
    },
  ];

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${base}/l/${encodeURIComponent(listing.slug)}`,
    lastModified: listing.lastBidAt ?? listing.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...listingPages];
}
