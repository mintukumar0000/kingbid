import { NextResponse } from "next/server";
import { z } from "zod";
import { nominateOnDethronement } from "@/lib/fallen-fund";

export const dynamic = "force-dynamic";

const schema = z.object({
  dethronementId: z.string().uuid(),
  nominatorListingId: z.string().uuid(),
  nomineeListingId: z.string().uuid(),
});

/** Free spotlight nomination on dethronement — no money involved. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid nomination." }, { status: 400 });
  }

  await nominateOnDethronement(
    parsed.data.dethronementId,
    parsed.data.nominatorListingId,
    parsed.data.nomineeListingId
  );
  return NextResponse.json({ ok: true });
}
