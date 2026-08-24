import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateSessionUser } from "@/lib/users";
import { proposeCategory, listCategoryProposals } from "@/lib/category-proposals";

export const dynamic = "force-dynamic";

const schema = z.object({
  slug: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const proposals = await listCategoryProposals("pending");
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const user = await getOrCreateSessionUser();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid proposal data." }, { status: 400 });
  }

  try {
    const proposal = await proposeCategory(user.id, parsed.data);
    return NextResponse.json({ ok: true, id: proposal.id, slug: proposal.slug });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
