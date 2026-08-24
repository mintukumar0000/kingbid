import { NextResponse } from "next/server";
import { z } from "zod";
import { approveCategoryProposal } from "@/lib/category-proposals";

export const dynamic = "force-dynamic";

const schema = z.object({
  proposalId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

function checkAdmin(request: Request): boolean {
  const password = request.headers.get("x-admin-password");
  return !!password && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { listCategoryProposals } = await import("@/lib/category-proposals");
  const proposals = await listCategoryProposals("pending");
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (parsed.data.action === "reject") {
    const { prisma } = await import("@/lib/db");
    await prisma.categoryProposal.update({
      where: { id: parsed.data.proposalId },
      data: { status: "rejected" },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const category = await approveCategoryProposal(parsed.data.proposalId);
    return NextResponse.json({ ok: true, slug: category.slug });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
