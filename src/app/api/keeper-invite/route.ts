import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateSessionUser } from "@/lib/users";
import { recordKeeperInviteVisit } from "@/lib/viral";

export const dynamic = "force-dynamic";

const schema = z.object({
  inviterUserId: z.string().uuid(),
  roomSlug: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getOrCreateSessionUser();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite payload." }, { status: 400 });
  }

  await recordKeeperInviteVisit(parsed.data.inviterUserId, parsed.data.roomSlug, user.id);
  return NextResponse.json({ ok: true });
}
