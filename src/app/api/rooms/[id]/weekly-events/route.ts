import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { resolveRoomRecord } from "@/lib/room-stats";
import { createRoomWeeklyEvent, getRoomWeeklyEvents } from "@/lib/room-weekly-events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await resolveRoomRecord(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const events = await getRoomWeeklyEvents(room.id);
  return NextResponse.json(events);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await resolveRoomRecord(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event data" }, { status: 400 });

  const user = await getOrCreateSessionUser();
  try {
    const event = await createRoomWeeklyEvent(user.id, room.id, parsed.data);
    return NextResponse.json({ ok: true, event });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 403 });
  }
}
