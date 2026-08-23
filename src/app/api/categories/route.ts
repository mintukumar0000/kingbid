import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ isMeta: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isMeta: true,
      boards: {
        where: { region: null },
        select: {
          id: true,
          _count: { select: { listings: { where: { status: "active", currentBid: { gt: 0 } } } } },
        },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      isMeta: c.isMeta,
      boardId: c.boards[0]?.id ?? null,
      listingCount: c.boards[0]?._count.listings ?? 0,
    })),
  });
}
