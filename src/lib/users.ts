import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "kingbid_uid";

/** Lightweight session user — no password auth yet; email/handle on first action. */
export async function getOrCreateSessionUser(): Promise<{
  id: string;
  email: string | null;
  handle: string | null;
}> {
  const jar = await cookies();
  let sessionId = jar.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    const existing = await prisma.user.findUnique({
      where: { sessionId },
      select: { id: true, email: true, handle: true },
    });
    if (existing) return existing;
  }

  sessionId = crypto.randomUUID();
  const user = await prisma.user.create({
    data: { sessionId },
    select: { id: true, email: true, handle: true },
  });

  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return user;
}

export async function linkUserEmail(userId: string, email: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { email: email.toLowerCase() },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function getLatestKingbidScore(userId: string) {
  return prisma.kingbidScore.findFirst({
    where: { userId },
    orderBy: { computedAt: "desc" },
  });
}

export async function bumpKingbidScore(
  userId: string,
  delta: number,
  component: string
): Promise<void> {
  const latest = await getLatestKingbidScore(userId);
  let components: Record<string, number> = {};
  if (latest) {
    try {
      components = JSON.parse(latest.components) as Record<string, number>;
    } catch {
      components = {};
    }
  }
  components[component] = (components[component] ?? 0) + delta;
  const score = (latest?.score ?? 0) + delta;
  await prisma.kingbidScore.create({
    data: { userId, score, components: JSON.stringify(components) },
  });
}
