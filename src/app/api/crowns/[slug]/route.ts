import { NextResponse } from "next/server";
import { getCrown } from "@/lib/crowns";
import { getCrownState, getCrownHistory } from "@/lib/crowns-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const crown = getCrown(slug);
  if (!crown) return NextResponse.json({ error: "Crown not found." }, { status: 404 });

  const [state, history] = await Promise.all([getCrownState(crown), getCrownHistory(crown, 12)]);

  return NextResponse.json({ crown, state, history });
}
