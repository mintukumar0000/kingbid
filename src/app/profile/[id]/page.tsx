import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDiscoveryList } from "@/lib/kingmaker";
import { getKeeperProfileStats } from "@/lib/keeper-profile";
import { keeperLevelLabel, keeperLevelRank } from "@/lib/keeper-privileges";
import { formatMoney } from "@/lib/format";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { handle: id }] },
    select: { id: true, handle: true, name: true, email: true, createdAt: true },
  });
  if (!user) notFound();

  const [score, discovery, keepers, keeperStats] = await Promise.all([
    prisma.kingbidScore.findFirst({
      where: { userId: user.id },
      orderBy: { computedAt: "desc" },
    }),
    getDiscoveryList(user.id),
    prisma.roomKeeper.findMany({
      where: { userId: user.id, level: { not: "observer" } },
      include: { room: { select: { slug: true, name: true } } },
      orderBy: { leveledUpAt: "desc" },
    }),
    getKeeperProfileStats(user.id),
  ]);

  const displayName = user.handle ? `@${user.handle}` : user.name ?? "Founder";
  const topLevel = [...keepers].sort((a, b) => keeperLevelRank(b.level) - keeperLevelRank(a.level))[0]?.level;

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-3xl py-10`}>
        <p className="kb-eyebrow">Kingmaker profile</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold">{displayName}</h1>
        {topLevel && (
          <p className="mt-2 text-[15px] text-muted">
            🏰 {keeperLevelLabel(topLevel)}
            {keeperStats.roomsCurated > 0 ? ` · ${keeperStats.roomsCurated} room(s) curated` : ""}
          </p>
        )}
        <p className="mt-1 text-[13px] text-muted">
          Founded {user.createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ProfileStat label="Kingbid Score" value={String(score?.score ?? 0)} />
          <ProfileStat label="Members" value={keeperStats.membersInRooms.toLocaleString()} />
          <ProfileStat label="Products discovered" value={keeperStats.productsDiscovered.toLocaleString()} />
          <ProfileStat label="Called #1" value={keeperStats.successfulProducts.toLocaleString()} />
        </div>

        {keeperStats.rooms.length > 0 && (
          <section className="mt-8 bracket-card">
            <h2 className="font-display text-[18px] font-semibold">Rooms</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              {keeperStats.rooms.map((r) => (
                <li key={`${r.slug}-${r.role}`} className="flex items-center justify-between">
                  <Link href={`/?room=${r.slug}`} className="font-medium hover:text-accent hover:underline">
                    {r.name}
                  </Link>
                  <span className="text-[12px] text-muted">{r.role}</span>
                </li>
              ))}
            </ul>
            {keeperStats.bidVolumeCurated > 0 && (
              <p className="mt-3 text-[12px] text-muted">
                {formatMoney(keeperStats.bidVolumeCurated)} total bids ·{" "}
                {keeperStats.totalClicksCurated.toLocaleString()} clicks across curated rooms
              </p>
            )}
          </section>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="bracket-card">
            <h2 className="text-[14px] font-semibold">Kingbid Score</h2>
            <p className="font-mono-label mt-2 text-3xl font-bold">{score?.score ?? 0}</p>
            <p className="mt-2 text-[12px] text-muted">From discovery bets, Call It wins, and kingmaker activity.</p>
          </section>
          <section className="bracket-card">
            <h2 className="text-[14px] font-semibold">Keeper levels</h2>
            {keepers.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">0 rooms — start on /founders with Discovery bets.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-[13px]">
                {keepers.map((k) => (
                  <li key={k.id}>
                    {k.room.name} · {keeperLevelLabel(k.level)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-6 bracket-card">
          <h2 className="text-[14px] font-semibold">Discovery list ({discovery.length}/10)</h2>
          {discovery.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted">0 bets called yet — add picks on Founder Hub.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {discovery.map((d) => (
                <li key={d.listingId} className="flex justify-between gap-2">
                  <Link href={`/l/${d.listing.slug}`} className="font-medium hover:underline">
                    {d.listing.displayUrl}
                  </Link>
                  <span className="text-muted tabular">{formatMoney(d.listing.currentBid)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-[13px]">
          <Link href="/founders" className="font-medium text-accent hover:underline">
            ← Back to Founder Hub
          </Link>
        </p>
      </div>
    </main>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono-label mt-1 text-[18px] font-bold">{value}</p>
    </div>
  );
}
