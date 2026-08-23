import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { evaluateKeeperLevel } from "@/lib/keepers";
import { getRoomCommunityPayload } from "@/lib/room-stats";
import { KEEPER_LEVEL_INFO } from "@/lib/keeper-privileges";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getOrCreateSessionUser();
  const payload = await getRoomCommunityPayload(id, user.id);
  if (!payload) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  await evaluateKeeperLevel(user.id, payload.room.id);

  const myLevel = await prisma.roomKeeper.findUnique({
    where: { userId_roomId: { userId: user.id, roomId: payload.room.id } },
    select: { level: true },
  });

  return NextResponse.json({
    ...payload,
    myKeeperLevel: myLevel?.level ?? "observer",
    levelLadder: KEEPER_LEVEL_INFO,
  });
}
