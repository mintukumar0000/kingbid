import { NextResponse } from "next/server";
import { getUnderdogRow } from "@/lib/underdog";
import { getBoardIdForCategorySlug } from "@/lib/boards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  let boardId: string | null = null;
  if (category) boardId = await getBoardIdForCategorySlug(category);

  const rows = await getUnderdogRow(boardId, 10);
  return NextResponse.json({ underdogs: rows });
}
