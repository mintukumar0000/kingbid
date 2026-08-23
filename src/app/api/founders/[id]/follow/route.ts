import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { prisma } from "@/lib/db";
import { followFounder, unfollowFounder } from "@/lib/follows";

export const dynamic = "force-dynamic";

async function resolveUser(id: string) {
  return prisma.user.findFirst({
    where: { OR: [{ id }, { handle: id }] },
    select: { id: true },
  });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await resolveUser(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await getOrCreateSessionUser();
  try {
    await followFounder(user.id, target.id);
    return NextResponse.json({ ok: true, following: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Follow failed" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await resolveUser(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await getOrCreateSessionUser();
  await unfollowFounder(user.id, target.id);
  return NextResponse.json({ ok: true, following: false });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await resolveUser(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await getOrCreateSessionUser();
  const row = await prisma.founderFollow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
  });
  return NextResponse.json({ following: !!row });
}
