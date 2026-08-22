// Platform launch timestamp — created the first time anything asks for it,
// then immutable. Used for the honest "since launch" counters.

import { prisma } from "@/lib/db";

let cached: Date | null = null;

export async function getLaunchedAt(): Promise<Date> {
  if (cached) return cached;
  const existing = await prisma.meta.findUnique({ where: { key: "launchedAt" } });
  if (existing) {
    cached = new Date(existing.value);
    return cached;
  }
  const now = new Date();
  const row = await prisma.meta.upsert({
    where: { key: "launchedAt" },
    create: { key: "launchedAt", value: now.toISOString() },
    update: {},
  });
  cached = new Date(row.value);
  return cached;
}
