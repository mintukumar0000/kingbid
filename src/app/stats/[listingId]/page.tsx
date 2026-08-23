import Link from "next/link";
import { Header } from "@/components/Header";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";
import { canShowOnPublicBoard } from "@/lib/guardrails";
import { PAGE } from "@/lib/layout";
import { ClickChart } from "@/components/ClickChart";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ listingId: string }> };

export default async function ListingStatsPage({ params }: Props) {
  const { listingId } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      slug: true,
      displayUrl: true,
      title: true,
      clickCount: true,
      currentBid: true,
      status: true,
      createdAt: true,
    },
  });

  if (!listing || !canShowOnPublicBoard(listing.status)) {
    return (
      <main className="flex-1">
        <Header />
        <div className={`${PAGE} py-10`}>
          <p className="text-muted">Listing not found.</p>
        </div>
      </main>
    );
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const clicks = await prisma.click.findMany({
    where: { listingId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const c of clicks) {
    const day = c.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const timeline = [...byDay.entries()].map(([date, count]) => ({ date, count }));

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <h1 className="text-2xl font-bold">Click stats</h1>
        <p className="mt-2 text-muted">
          <span className="font-semibold text-foreground">{listing.displayUrl}</span> ·{" "}
          {formatMoney(listing.currentBid)} bid ·{" "}
          <span className="tabular">{listing.clickCount.toLocaleString()}</span> total clicks
        </p>
        <p className="mt-1 text-[13px] text-muted">
          Counts come from real outbound clicks via{" "}
          <Link href={`/go/${listing.id}`} className="text-accent hover:underline">
            /go/{listing.slug}
          </Link>
          .
        </p>
        <section className="mt-8 rounded-[20px] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h2 className="text-[15px] font-semibold">Last 30 days</h2>
          <div className="mt-4">
            <ClickChart timeline={timeline} />
          </div>
        </section>
        <p className="mt-6 text-[13px]">
          <Link href={`/l/${listing.slug}`} className="text-accent hover:underline">
            ← Back to listing
          </Link>
        </p>
      </div>
    </main>
  );
}
