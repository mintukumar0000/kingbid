// Platform launch timestamp — used for honest "since launch" counters.
// Set LAUNCHED_AT (ISO) on Vercel to reset public launch time; syncs to DB.

import { prisma } from "@/lib/db";

let cached: Date | null = null;

function parseLaunchDate(raw: string): Date | null {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getLaunchedAt(): Promise<Date> {
  if (cached) return cached;

  const envLaunch = process.env.LAUNCHED_AT?.trim();
  const envDate = envLaunch ? parseLaunchDate(envLaunch) : null;

  const existing = await prisma.meta.findUnique({ where: { key: "launchedAt" } });

  if (envDate) {
    const iso = envDate.toISOString();
    if (!existing || existing.value !== iso) {
      await prisma.meta.upsert({
        where: { key: "launchedAt" },
        create: { key: "launchedAt", value: iso },
        update: { value: iso },
      });
    }
    cached = envDate;
    return cached;
  }

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
