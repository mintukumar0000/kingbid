import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSessionUser, getLatestKingbidScore } from "@/lib/users";
import { getDiscoveryList } from "@/lib/kingmaker";
import { getActiveSubscription } from "@/lib/subscriptions";
import { canRequestRoom } from "@/lib/keepers";

export const dynamic = "force-dynamic";

/** Current session founder — score, keeper levels, subscription. */
export async function GET() {
  const user = await getOrCreateSessionUser();
  const [score, subscription, keepers, discoveryCount, canCreateRoom] = await Promise.all([
    getLatestKingbidScore(user.id),
    getActiveSubscription(user.id),
    prisma.roomKeeper.findMany({
      where: { userId: user.id },
      include: { room: { select: { slug: true, name: true } } },
    }),
    prisma.discoveryList.count({ where: { userId: user.id } }),
    canRequestRoom(user.id),
  ]);

  const pendingRoom = await prisma.room.findFirst({
    where: { requesterId: user.id, status: "pending" },
    select: { slug: true, name: true },
  });

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    handle: user.handle,
    kingbidScore: score?.score ?? 0,
    scoreComponents: score ? JSON.parse(score.components || "{}") : {},
    subscription: subscription ? { tier: subscription.tier, renewsAt: subscription.renewsAt } : null,
    keeperLevels: keepers.map((k) => ({ room: k.room.name, slug: k.room.slug, level: k.level })),
    discoveryBets: discoveryCount,
    canCreateRoom,
    pendingRoomRequest: pendingRoom,
  });
}
