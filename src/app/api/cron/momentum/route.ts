import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { emitBreakoutEvents } from "@/lib/momentum";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const emitted = await emitBreakoutEvents();
  return NextResponse.json({ ok: true, emitted });
}
