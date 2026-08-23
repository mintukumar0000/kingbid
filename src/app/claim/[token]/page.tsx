import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";
import { getInviteByToken } from "@/lib/invites";
import { ClaimListingForm } from "@/components/ClaimListingForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function ClaimInvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite || invite.status === "expired") notFound();

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-lg py-12`}>
        <h1 className="text-2xl font-bold">Claim your listing</h1>
        <p className="mt-2 text-sm text-muted">
          You were invited to list on Kingbid
          {invite.category ? ` in ${invite.category.name}` : ""}. Submit your own URL — nothing is
          added until you confirm and pay.
        </p>
        <p className="mt-4 text-[13px] text-muted">
          Invited: <span className="text-foreground">{invite.invitedContact}</span>
        </p>

        <ClaimListingForm token={token} categorySlug={invite.category?.slug ?? null} />

        <p className="mt-6 text-[12px] text-muted">
          Wrong invite?{" "}
          <Link href="/" className="text-accent hover:underline">
            Return home
          </Link>
        </p>
      </div>
    </main>
  );
}
