import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { resolveRoomRecord } from "@/lib/room-stats";
import { getRoomPins, pinListing, unpinListing } from "@/lib/room-pins";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function roomIdFromParam(id: string) {
  const room = await resolveRoomRecord(id);
  return room?.id ?? null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = await roomIdFromParam(id);
  if (!roomId) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const pins = await getRoomPins(roomId);
  return NextResponse.json({ pins });
}

const pinSchema = z.object({ listingSlug: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = await roomIdFromParam(id);
  if (!roomId) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "listingSlug required" }, { status: 400 });

  const user = await getOrCreateSessionUser();
  try {
    await pinListing(user.id, roomId, parsed.data.listingSlug);
    const pins = await getRoomPins(roomId);
    return NextResponse.json({ ok: true, pins });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Pin failed" }, { status: 403 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = await roomIdFromParam(id);
  if (!roomId) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const pinId = new URL(request.url).searchParams.get("pinId");
  if (!pinId) return NextResponse.json({ error: "pinId required" }, { status: 400 });

  const user = await getOrCreateSessionUser();
  try {
    await unpinListing(user.id, roomId, pinId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unpin failed" }, { status: 403 });
  }
}
