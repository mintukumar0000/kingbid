import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRoomEvents, eventHeadline } from "@/lib/platform-events";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, slug: true, name: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const events = await getRoomEvents(room.id);
  return NextResponse.json({
    room,
    events: events.map((e) => ({
      ...e,
      headline: eventHeadline(e.eventType, e.metadata),
    })),
  });
}
