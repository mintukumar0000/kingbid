import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isCampaignUiEnabled } from "@/lib/nepal-campaign-config";
import {
  sendVerificationRequestAdminNotice,
  sendVerificationRequestReceived,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(120).optional(),
  message: z.string().max(1000).optional(),
  paymentPublicId: z.string().max(80).optional(),
  listingUrl: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  if (!isCampaignUiEnabled()) {
    return NextResponse.json({ error: "Campaign verification is unavailable." }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (!rateLimit(`nepal-verify:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const row = await prisma.nepalVerificationRequest.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? "",
      message: parsed.data.message ?? "",
      paymentPublicId: parsed.data.paymentPublicId ?? null,
      listingUrl: parsed.data.listingUrl ?? null,
    },
  });

  await Promise.all([
    sendVerificationRequestAdminNotice({
      id: row.id,
      email: row.email,
      name: row.name,
      message: row.message,
      paymentPublicId: row.paymentPublicId,
      listingUrl: row.listingUrl,
    }),
    sendVerificationRequestReceived(row.email, row.name || undefined),
  ]);

  return NextResponse.json({ ok: true, id: row.id });
}
