import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { resolveCallItPredictions } from "@/lib/kingmaker";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = await resolveCallItPredictions();
  return NextResponse.json({ ok: true, resolved });
}
