import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createInvite, getOrCreatePromoInvite } from "@/lib/invites";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function checkPassword(provided: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** List promo links + recent personal invites (founder-only). */
export async function GET(request: Request) {
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const promos = await Promise.all(
    categories.map(async (c) => {
      try {
        const promo = await getOrCreatePromoInvite(c.slug);
        return { slug: c.slug, name: c.name, claimUrl: promo.claimUrl, claimToken: promo.claimToken };
      } catch {
        return { slug: c.slug, name: c.name, claimUrl: null, claimToken: null };
      }
    })
  );

  const personal = await prisma.invite.findMany({
    where: { reusable: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { category: { select: { slug: true, name: true } } },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingbid.lol";

  return NextResponse.json({
    promos,
    personal: personal.map((i) => ({
      id: i.id,
      invitedContact: i.invitedContact,
      category: i.category?.name ?? "Global",
      categorySlug: i.category?.slug ?? null,
      status: i.status,
      claimUrl: `${base}/claim/${i.claimToken}`,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}

const postSchema = z.object({
  invitedContact: z.string().min(1),
  categorySlug: z.string().optional(),
  type: z.enum(["personal", "promo"]).default("personal"),
});

/** Create personal invite or ensure promo link for a category. */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`admin-invite:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite data." }, { status: 400 });
  }

  if (parsed.data.type === "promo") {
    if (!parsed.data.categorySlug) {
      return NextResponse.json({ error: "categorySlug required for promo." }, { status: 400 });
    }
    const promo = await getOrCreatePromoInvite(parsed.data.categorySlug);
    return NextResponse.json({
      type: "promo",
      claimUrl: promo.claimUrl,
      claimToken: promo.claimToken,
      categoryName: promo.categoryName,
      note: "Reusable — share on Twitter. Anyone can list with this link.",
    });
  }

  let categoryId: string | null = null;
  if (parsed.data.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: parsed.data.categorySlug },
      select: { id: true, name: true },
    });
    if (!cat) return NextResponse.json({ error: "Unknown category." }, { status: 404 });
    categoryId = cat.id;
  }

  const invite = await createInvite({
    invitedContact: parsed.data.invitedContact,
    categoryId,
    reusable: false,
  });

  return NextResponse.json({
    type: "personal",
    ...invite,
    note: "One-time — send to one founder only.",
  });
}
