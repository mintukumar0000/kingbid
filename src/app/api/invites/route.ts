import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createInvite } from "@/lib/invites";

export const dynamic = "force-dynamic";

const schema = z.object({
  invitedContact: z.string().email().or(z.string().regex(/^@[A-Za-z0-9_]{1,15}$/)),
  categorySlug: z.string().optional(),
});

/** Create invite link — founder opts in via /claim/{token}, never pre-listed. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email or @handle required." }, { status: 400 });
  }

  let categoryId: string | null = null;
  if (parsed.data.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: parsed.data.categorySlug },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ error: "Unknown category." }, { status: 404 });
    categoryId = cat.id;
  }

  const invite = await createInvite({
    invitedContact: parsed.data.invitedContact,
    categoryId,
  });

  return NextResponse.json(invite);
}
