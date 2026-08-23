import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { resolveRoomRecord } from "@/lib/room-stats";
import { followRoom, unfollowRoom } from "@/lib/follows";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await resolveRoomRecord(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const user = await getOrCreateSessionUser();
  await followRoom(user.id, room.id);
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await resolveRoomRecord(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const user = await getOrCreateSessionUser();
  await unfollowRoom(user.id, room.id);
  return NextResponse.json({ ok: true, following: false });
}
