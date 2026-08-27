import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { CrownDetailClient } from "@/components/crowns/CrownDetailClient";
import { getCrown } from "@/lib/crowns";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crown = getCrown(slug);
  if (!crown) return { title: "Crown not found" };
  return {
    title: `${crown.name} — KingBid 👑`,
    description: `Who's ${crown.name}? Bid for the crown and keep it until someone outbids you.`,
  };
}

export default async function CrownPage({ params }: Props) {
  const { slug } = await params;
  if (!getCrown(slug)) notFound();

  return (
    <main className="flex-1">
      <Header />
      <CrownDetailClient slug={slug} />
    </main>
  );
}
