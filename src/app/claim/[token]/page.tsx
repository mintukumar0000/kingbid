import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";
import { getInviteByToken, inviteIsUsable } from "@/lib/invites";
import { getCategoryRoomTheme } from "@/lib/category-rooms";
import { ClaimListingForm } from "@/components/ClaimListingForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function ClaimInvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite || !inviteIsUsable(invite)) notFound();

  const theme = invite.category ? getCategoryRoomTheme(invite.category.slug) : null;
  const isPromo = invite.reusable;

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-lg py-10`}>
        <div className="rounded-[24px] border border-[#f0cfc3] bg-surface p-6 shadow-[var(--shadow)] sm:p-8">
          {theme && (
            <div className="mb-5 flex justify-center">
              <div className="flex aspect-square w-[120px] flex-col items-center justify-center rounded-[18px] border-2 border-[#f0cfc3] bg-peach p-4">
                <span className="text-2xl text-accent">{theme.icon}</span>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {theme.roomLabel}
                </p>
              </div>
            </div>
          )}

          <h1 className="text-center text-2xl font-bold">
            {isPromo ? "Join this room" : "Claim your listing"}
          </h1>
          <p className="mt-2 text-center text-[14px] leading-relaxed text-muted">
            {isPromo ? (
              <>
                Public invite for{" "}
                <strong className="text-foreground">{invite.category?.name ?? "KingBid"}</strong>.
                Submit your URL and pay — anyone with this link can list.
              </>
            ) : (
              <>
                Personal invite
                {invite.category ? ` for ${invite.category.name}` : ""}. Nothing goes live until you
                confirm and pay.
              </>
            )}
          </p>
          {!isPromo && (
            <p className="mt-3 text-center text-[13px] text-muted">
              Invited: <span className="font-medium text-foreground">{invite.invitedContact}</span>
            </p>
          )}

          <ClaimListingForm token={token} categorySlug={invite.category?.slug ?? null} />
        </div>

        <p className="mt-6 text-center text-[12px] text-muted">
          Wrong link?{" "}
          <Link href="/" className="text-accent hover:underline">
            Browse all rooms
          </Link>
        </p>
      </div>
    </main>
  );
}
