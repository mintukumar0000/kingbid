import { NextResponse } from "next/server";
import { getGlobalBoardId, reignDuration } from "@/lib/reign";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const boardId = await getGlobalBoardId();
  const duration = await reignDuration(listingId, boardId);
  return NextResponse.json({ duration });
}
