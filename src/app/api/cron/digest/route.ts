import { NextResponse } from "next/server";
import { buildWeeklyDigestStats, getDigestSubscribers, sendWeeklyDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Weekly digest — schedule via Vercel Cron (Mondays 9am UTC). */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await buildWeeklyDigestStats();
  const subscribers = await getDigestSubscribers();
  let sent = 0;

  for (const email of subscribers) {
    await sendWeeklyDigest(email, stats);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent, stats });
}
