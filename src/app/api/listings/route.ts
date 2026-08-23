import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { handleBidRequest } from "@/lib/bid-request";
import { parseScope, resolveCountryCode } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const scope = parseScope(searchParams.get("scope"));
  const countryCode = scope === "local" ? resolveCountryCode(request) : null;
  const categorySlug = searchParams.get("category") || null;
  const data = await getLeaderboard(page, limit, scope, countryCode, categorySlug);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15" },
  });
}

// POST /api/listings creates a new listing + initial bid (same pipeline as /api/bids)
export async function POST(request: Request) {
  return handleBidRequest(request);
}
