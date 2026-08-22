import { NextResponse } from "next/server";
import { countryDisplayName, getCountryFromRequest } from "@/lib/geo";

export const dynamic = "force-dynamic";

/** Visitor country for local leaderboard + local bids. */
export async function GET(request: Request) {
  const countryCode = getCountryFromRequest(request);
  return NextResponse.json({
    countryCode,
    countryName: countryDisplayName(countryCode),
  });
}
