import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function checkPassword(provided: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.room.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { email: true, id: true } },
    },
  });

  return NextResponse.json({
    pending: pending.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      roomType: r.roomType,
      requesterEmail: r.requester?.email,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId, action } = (await request.json()) as { roomId: string; action: "approve" | "reject" };
  if (!roomId || !action) {
    return NextResponse.json({ error: "roomId and action required" }, { status: 400 });
  }

  if (action === "approve") {
    const pending = await prisma.room.findUnique({ where: { id: roomId } });
    if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "active",
        curatorUserId: pending.requesterId,
      },
    });
    if (pending.requesterId) {
      await prisma.roomKeeper.upsert({
        where: { userId_roomId: { userId: pending.requesterId, roomId } },
        create: { userId: pending.requesterId, roomId, level: "keeper" },
        update: { level: "keeper", leveledUpAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true, status: "active" });
  }

  await prisma.room.delete({ where: { id: roomId } });
  return NextResponse.json({ ok: true, status: "rejected" });
}
