import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const requests = await prisma.nepalVerificationRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      message: r.message,
      paymentPublicId: r.paymentPublicId,
      listingUrl: r.listingUrl,
      status: r.status,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
      repliedAt: r.repliedAt?.toISOString() ?? null,
    })),
    pendingCount: await prisma.nepalVerificationRequest.count({ where: { status: "pending" } }),
  });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "replied"]),
  adminNotes: z.string().max(2000).optional(),
});

export async function PATCH(request: Request) {
  if (!checkPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const row = await prisma.nepalVerificationRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      repliedAt: parsed.data.status === "replied" ? new Date() : null,
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: row.id,
      status: row.status,
      adminNotes: row.adminNotes,
      repliedAt: row.repliedAt?.toISOString() ?? null,
    },
  });
}
