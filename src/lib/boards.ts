import { prisma } from "@/lib/db";

/** Global board (categoryId + region both null). */
export async function getGlobalBoardId(): Promise<string> {
  let board = await prisma.board.findFirst({
    where: { categoryId: null, region: null },
    select: { id: true },
  });
  if (!board) {
    board = await prisma.board.create({
      data: { categoryId: null, region: null },
      select: { id: true },
    });
  }
  return board.id;
}

export async function getBoardIdForCategorySlug(slug: string): Promise<string | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      boards: { where: { region: null }, select: { id: true }, take: 1 },
    },
  });
  return category?.boards[0]?.id ?? null;
}

export async function ensureCategoryBoard(categoryId: string): Promise<string> {
  const existing = await prisma.board.findFirst({
    where: { categoryId, region: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.board.create({
    data: { categoryId, region: null },
    select: { id: true },
  });
  return created.id;
}
