import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ShareButtons } from "@/components/ShareButtons";
import { SuccessConfetti } from "@/components/SuccessConfetti";
import { SuccessPaymentStatus } from "@/components/SuccessPaymentStatus";
import { BadgeEmbedSnippet } from "@/components/BadgeEmbedSnippet";
import { prisma } from "@/lib/db";
import { failBid } from "@/lib/bidding";
import { formatMoney } from "@/lib/format";
import { getRankForListing } from "@/lib/listing-page";
import { BRAND_LABEL, SITE_NAME } from "@/lib/brand";
import { isDodoLiveMode } from "@/lib/dodo";
import { syncPaymentFromDodo } from "@/lib/dodo-sync";
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

  // Instant confirm when Dodo redirects back with payment_id (webhook optional)
  if (query.payment_id && query.status?.toLowerCase() !== "failed") {
    await syncPaymentFromDodo(paymentId, query.payment_id);
  }

  const bid = await prisma.bid.findUnique({
    where: { paymentId },
    include: { listing: { select: { title: true, displayUrl: true, slug: true } } },
  });

  if (!bid) notFound();

  const failed = bid.status === "failed" || dodoFailed;
  const completed = bid.status === "completed";
  const livePayments = isDodoLiveMode();
  const rank = completed ? await getRankForListing(bid.listingId) : null;
  const total = completed ? bid.totalAfter : bid.amount;

  const shareText =
    rank === 1
      ? `👑 I'm officially King on ${SITE_NAME} — ${formatMoney(total)}. Someone can steal my crown.`
      : rank
        ? `I bid ${formatMoney(total)} on ${SITE_NAME}. Think you can steal the crown?`
        : `I just claimed a crown on ${SITE_NAME}.`;

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
            {livePayments ? (
              <p className="mt-2 text-[14px] text-muted">
                Try a different card or contact your bank. Make sure billing country on checkout
                matches your card.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[14px] text-muted">
                  Test cards only work when they <strong className="text-foreground">match checkout</strong>{" "}
                  (currency + billing country). A mismatch always declines.
                </p>
                <ul className="mt-3 space-y-2 text-left text-[13px] text-muted">
                  <li>
                    <strong className="text-foreground">Nepal (NPR):</strong> billing country{" "}
                    <strong>Nepal</strong>, pay in NPR · card{" "}
                    <code className="text-accent">4242 4242 4242 4242</code> · 06/32 · 123
                  </li>
                  <li>
                    <strong className="text-foreground">India (INR):</strong> billing country{" "}
                    <strong>India</strong>, pay in INR · card{" "}
                    <code className="text-accent">4576 2389 1277 1450</code> · 06/32 · 123
                  </li>
                  <li>
                    <strong className="text-foreground">US (USD):</strong> billing country{" "}
                    <strong>United States</strong>, pay in USD · card{" "}
                    <code className="text-accent">4242 4242 4242 4242</code> · 06/32 · 123
                  </li>
                </ul>
                <p className="mt-3 text-[12px] text-muted">
                  Do not use the India card on a USD/US checkout — that is what causes “card declined”.
                </p>
              </>
            )}
            <Link
              href="/"
              className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-[14px] font-semibold text-white hover:brightness-110"
            >
              Try again →
            </Link>
          </>
        ) : completed ? (
          <>
            <div className="text-6xl">👑</div>
            <h1 className="mt-4 text-3xl font-extrabold">
              {rank === 1 ? "You are now King" : "Crown secured"}
            </h1>
            <p className="mt-3 text-muted">
              <span className="font-semibold text-foreground">{bid.listing.title}</span> is live
              {rank ? (
                <>
                  {" "}
                  at{" "}
                  <span className={`font-extrabold ${rank === 1 ? "text-[var(--crown-gold)]" : "text-foreground"}`}>
                    #{rank}
                  </span>
                </>
              ) : null}{" "}
              with a total bid of{" "}
              <span className="tabular font-semibold text-[var(--crown-gold)]">{formatMoney(total)}</span>.
            </p>

            {rank === 1 && (
              <div className="crown-share-card mx-auto mt-6 max-w-sm rounded-2xl border border-[var(--crown-gold)]/30 bg-gradient-to-b from-[#1a1612] to-[#0f0d0b] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--crown-gold)]">Current King</p>
                <p className="mt-2 text-[18px] font-bold">{bid.listing.displayUrl}</p>
                <p className="font-mono-label mt-3 text-[36px] font-bold tabular text-[var(--crown-gold)]">{formatMoney(total)}</p>
                <p className="mt-2 text-[12px] text-muted">Someone can steal the crown.</p>
              </div>
            )}

            <div className="mt-8">
              <ShareButtons text={shareText} slug={bid.listing.slug} />
            </div>

            <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-left">
              <h2 className="text-[15px] font-semibold">Embed your rank badge</h2>
              <p className="mt-1 text-[13px] text-muted">Share proof of your spot on your site.</p>
              <div className="mt-3">
                <BadgeEmbedSnippet listingId={bid.listingId} slug={bid.listing.slug} />
              </div>
            </section>

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
            <SuccessPaymentStatus paymentId={paymentId} dodoPaymentId={query.payment_id} />
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
