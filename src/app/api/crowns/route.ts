import { NextResponse } from "next/server";
import { getAllCrowns, getRecentDethronements } from "@/lib/crowns-data";
import type { CrownGroup } from "@/lib/crowns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "all") as CrownGroup | "all" | "trending";

  const [crowns, dethronements] = await Promise.all([
    getAllCrowns(filter === "all" ? undefined : filter),
    getRecentDethronements(6),
  ]);

  const trending = filter === "all" ? [...crowns].sort((a, b) => b.bidDeltaToday - a.bidDeltaToday).slice(0, 5) : [];
  const mostWanted = [...crowns].sort((a, b) => b.watchers - a.watchers).slice(0, 4);

  return NextResponse.json({ crowns, trending, mostWanted, dethronements });
}
