import { prisma } from "@/lib/db";
import { slugFromDisplayUrl } from "@/lib/slug";

/** Resolve a listing from slug, @handle, or product URL — forgiving for Founder Hub forms. */
export async function resolveListingInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const bare = lower.replace(/^@/, "").replace(/\/$/, "");

  const direct = await prisma.listing.findUnique({
    where: { slug: bare },
    select: { id: true, slug: true, displayUrl: true, title: true, currentBid: true, boardId: true },
  });
  if (direct) return direct;

  const slugGuess = slugFromDisplayUrl(trimmed);
  if (slugGuess !== bare) {
    const byGuess = await prisma.listing.findUnique({
      where: { slug: slugGuess },
      select: { id: true, slug: true, displayUrl: true, title: true, currentBid: true, boardId: true },
    });
    if (byGuess) return byGuess;
  }

  return prisma.listing.findFirst({
    where: {
      OR: [
        { displayUrl: { equals: bare, mode: "insensitive" } },
        { displayUrl: { contains: bare, mode: "insensitive" } },
        { slug: { contains: bare.replace(/\./g, "") } },
        { title: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { id: true, slug: true, displayUrl: true, title: true, currentBid: true, boardId: true },
  });
}
