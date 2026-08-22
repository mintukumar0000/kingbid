import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ShareButtons } from "@/components/ShareButtons";
import { SuccessConfetti } from "@/components/SuccessConfetti";
import { SuccessPaymentStatus } from "@/components/SuccessPaymentStatus";
import { prisma } from "@/lib/db";
import { failBid } from "@/lib/bidding";
import { formatMoney } from "@/lib/format";
import { getRankForListing } from "@/lib/listing-page";
import { BRAND_LABEL, SITE_NAME } from "@/lib/brand";
import { ogClaimUrl } from "@/lib/site";
import { PAGE } from "@/lib/layout";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ status?: string; payment_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { paymentId } = await params;
  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: { select: { displayUrl: true } } },
  });
  if (!bid || bid.status !== "completed") {
    return { title: bid?.status === "failed" ? "Payment failed" : "Payment status" };
  }
  const rank = (await getRankForListing(bid.listingId)) ?? 1;
  const title = `I claimed #${rank} on ${BRAND_LABEL} for ${formatMoney(bid.totalAfter)}`;
  const og = ogClaimUrl(rank, bid.totalAfter, bid.listing.displayUrl);
  return {
    title,
    openGraph: { title, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function SuccessPaymentPage({ params, searchParams }: Props) {
  const { paymentId } = await params;
  const query = await searchParams;
  const dodoFailed = query.status?.toLowerCase() === "failed";

  if (dodoFailed && query.payment_id) {
    await failBid(paymentId);
  }

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: { select: { title: true, displayUrl: true, slug: true } } },
  });

  if (!bid) notFound();

  const failed = bid.status === "failed" || dodoFailed;
  const completed = bid.status === "completed";
  const rank = completed ? await getRankForListing(bid.listingId) : null;
  const total = completed ? bid.totalAfter : bid.amount;

  const shareText =
    rank === 1
      ? `I just claimed #1 on ${SITE_NAME} for ${formatMoney(total)}! Think you can outbid me? 👑`
      : rank
        ? `I claimed #${rank} on ${SITE_NAME} for ${formatMoney(total)}. Think you can outbid me?`
        : `I just claimed my rank on ${SITE_NAME}. Think you can outbid me?`;

  return (
    <main className="flex-1">
      <Header />
      {completed && <SuccessConfetti />}
      <div className={`${PAGE} mx-auto max-w-lg px-4 py-20 text-center`}>
        {failed ? (
          <>
            <div className="text-6xl">😕</div>
            <h1 className="mt-4 text-3xl font-extrabold">Payment failed</h1>
            <p className="mt-3 text-muted">
              Your card was declined or the checkout was cancelled. No charge was completed — nothing
              was added to the board.
            </p>
            <p className="mt-2 text-[14px] text-muted">
              Use a Dodo <strong className="text-foreground">test card</strong> in test mode:{" "}
              <code className="text-accent">4242 4242 4242 4242</code> · expiry{" "}
              <code className="text-accent">06/32</code> · CVC <code className="text-accent">123</code>
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-[14px] font-semibold text-white hover:brightness-110"
            >
              Try again →
            </Link>
          </>
        ) : completed ? (
          <>
            <div className="text-6xl">🎉</div>
            <h1 className="mt-4 text-3xl font-extrabold">Payment confirmed!</h1>
            <p className="mt-3 text-muted">
              <span className="font-semibold text-foreground">{bid.listing.title}</span> is live
              {rank ? (
                <>
                  {" "}
                  at{" "}
                  <span
                    className={`font-extrabold ${rank === 1 ? "text-gold" : "text-foreground"}`}
                  >
                    #{rank}
                  </span>
                </>
              ) : null}{" "}
              with a total bid of{" "}
              <span className="tabular font-semibold text-foreground">{formatMoney(total)}</span>.
            </p>

            <div className="mt-8">
              <ShareButtons text={shareText} slug={bid.listing.slug} />
            </div>

            <p className="mt-4 text-[13px] text-muted">
              Share your link with <code className="text-accent">?ref={bid.listing.slug}</code> —
              earn $1 credit when someone bids via your link.
            </p>

            <p className="mt-6 text-sm text-muted">
              Someone can outbid you at any moment.{" "}
              <Link href="/" className="text-accent underline underline-offset-2">
                Watch the board →
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl">⏳</div>
            <h1 className="mt-4 text-3xl font-extrabold">Confirming payment…</h1>
            <SuccessPaymentStatus paymentId={paymentId} />
            <p className="mt-6 text-sm text-muted">
              <Link href="/" className="text-accent underline underline-offset-2">
                Back to leaderboard →
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
