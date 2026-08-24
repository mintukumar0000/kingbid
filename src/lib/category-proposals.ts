import { prisma } from "@/lib/db";
import { getGlobalKeeperLevel } from "@/lib/keepers";

export async function proposeCategory(
  userId: string,
  input: { slug: string; name: string; description?: string }
) {
  const level = await getGlobalKeeperLevel(userId);
  if (level !== "legendary_keeper") {
    throw new Error("Legendary Keeper required to propose official categories.");
  }

  const existing = await prisma.categoryProposal.findFirst({
    where: { slug: input.slug, status: "pending" },
  });
  if (existing) throw new Error("A pending proposal with this slug already exists.");

  return prisma.categoryProposal.create({
    data: {
      userId,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: input.name,
      description: input.description ?? "",
    },
  });
}

export async function listCategoryProposals(status = "pending") {
  return prisma.categoryProposal.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { handle: true, name: true, id: true } } },
  });
}

export async function approveCategoryProposal(proposalId: string) {
  const proposal = await prisma.categoryProposal.findUnique({ where: { id: proposalId } });
  if (!proposal || proposal.status !== "pending") throw new Error("Proposal not found.");

  const category = await prisma.category.create({
    data: {
      slug: proposal.slug,
      name: proposal.name,
      description: proposal.description,
      isMeta: false,
    },
  });

  await prisma.board.create({
    data: { categoryId: category.id, region: null },
  });

  await prisma.room.create({
    data: {
      slug: proposal.slug,
      name: proposal.name,
      description: proposal.description,
      categoryId: category.id,
      roomType: "category",
      status: "active",
    },
  });

  await prisma.categoryProposal.update({
    where: { id: proposalId },
    data: { status: "approved" },
  });

  return category;
}
