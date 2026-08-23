import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateSessionUser } from "@/lib/users";
import { createCallItPrediction } from "@/lib/kingmaker";

export const dynamic = "force-dynamic";

const schema = z.object({
  predictedListingId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boardId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid prediction." }, { status: 400 });
  }

  const user = await getOrCreateSessionUser();
  const predictionId = await createCallItPrediction(
    user.id,
    boardId,
    parsed.data.predictedListingId
  );
  return NextResponse.json({ ok: true, predictionId });
}
