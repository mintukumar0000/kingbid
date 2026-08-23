import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDiscoveryList } from "@/lib/kingmaker";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { handle: id }] },
    select: { id: true, handle: true, name: true, email: true, createdAt: true },
  });
  if (!user) notFound();

  const [score, discovery, keepers] = await Promise.all([
    prisma.kingbidScore.findFirst({
      where: { userId: user.id },
      orderBy: { computedAt: "desc" },
    }),
    getDiscoveryList(user.id),
    prisma.roomKeeper.findMany({
      where: { userId: user.id },
      include: { room: { select: { slug: true, name: true } } },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {user.name ?? user.handle ?? "Founder"}
      </h1>
      <p className="mt-1 text-[13px] text-muted">
        Kingmaker profile · joined {user.createdAt.toLocaleDateString()}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-semibold">Kingbid Score</h2>
          <p className="mt-2 text-3xl font-bold tabular">{score?.score ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-semibold">Room Keeper levels</h2>
          <ul className="mt-2 space-y-1 text-[13px]">
            {keepers.length === 0 ? (
              <li className="text-muted">0 rooms curated yet.</li>
            ) : (
              keepers.map((k) => (
                <li key={k.id}>
                  {k.room.name} · {k.level}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-[13px] font-semibold">Discovery list (10 bets)</h2>
        {discovery.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">0 bets called yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-[13px]">
            {discovery.map((d) => (
              <li key={d.listingId}>
                <Link href={`/l/${d.listing.slug}`} className="font-medium hover:underline">
                  {d.listing.displayUrl}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
