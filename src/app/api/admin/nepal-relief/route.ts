import { NextResponse } from "next/server";
import { z } from "zod";
import { createDonation, createSettlement } from "@/lib/nepal-campaign";

export const dynamic = "force-dynamic";

function checkAdmin(request: Request): boolean {
  const password = request.headers.get("x-admin-password");
  return !!password && password === process.env.ADMIN_PASSWORD;
}

const settlementSchema = z.object({
  action: z.literal("settlement"),
  periodStart: z.string(),
  periodEnd: z.string(),
  grossAmount: z.number().int().positive(),
  adjustments: z.number().int().optional(),
  netAmount: z.number().int().positive(),
  settlementDate: z.string(),
  evidenceUrl: z.string().url().optional(),
});

const donationSchema = z.object({
  action: z.literal("donation"),
  amount: z.number().int().positive(),
  recipientName: z.string().optional(),
  donatedAt: z.string(),
  receiptUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = (body as { action?: string }).action;

  if (action === "settlement") {
    const parsed = settlementSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid settlement data." }, { status: 400 });
    const row = await createSettlement({
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      grossAmount: parsed.data.grossAmount,
      adjustments: parsed.data.adjustments,
      netAmount: parsed.data.netAmount,
      settlementDate: new Date(parsed.data.settlementDate),
      evidenceUrl: parsed.data.evidenceUrl,
    });
    return NextResponse.json({ ok: true, id: row.id, settlementNumber: row.settlementNumber });
  }

  if (action === "donation") {
    const parsed = donationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid donation data." }, { status: 400 });
    const row = await createDonation({
      amount: parsed.data.amount,
      recipientName: parsed.data.recipientName,
      donatedAt: new Date(parsed.data.donatedAt),
      receiptUrl: parsed.data.receiptUrl,
    });
    return NextResponse.json({ ok: true, id: row.id, donationNumber: row.donationNumber });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
