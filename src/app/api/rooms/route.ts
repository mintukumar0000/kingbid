import { NextResponse } from "next/server";
import { syncRoomsFromCategories, requestRoom } from "@/lib/rooms";
import { getOrCreateSessionUser } from "@/lib/users";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await syncRoomsFromCategories();
  return NextResponse.json({ synced: count });
}

const createSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  roomType: z.enum(["category", "geo", "founder_type", "tech"]).optional(),
  parentRoomId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid room data." }, { status: 400 });
  }

  const user = await getOrCreateSessionUser();
  const room = await requestRoom(user.id, parsed.data);
  return NextResponse.json({
    id: room.id,
    slug: room.slug,
    status: room.status,
  });
}
