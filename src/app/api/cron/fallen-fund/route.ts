import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { accrueWeeklyPool, distributeFallenFund } from "@/lib/fallen-fund";

export const dynamic = "force-dynamic";

/** Phase 4 — visibility grants only. Enable after legal/payment review. */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.FALLEN_FUND_ENABLED !== "true") {
    return NextResponse.json({ ok: false, reason: "Fallen Fund disabled until legal review." });
  }

  const poolId = await accrueWeeklyPool();
  const granted = await distributeFallenFund(poolId);
  return NextResponse.json({ ok: true, poolId, granted });
}
