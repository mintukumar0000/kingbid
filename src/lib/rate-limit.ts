// In-memory sliding-window rate limiter. Works per server instance, which is
// fine for local dev and single-region deployments. For multi-instance
// production, swap the store for Upstash Redis (same interface).

import { createHash } from "crypto";

type Window = { timestamps: number[] };

const store = new Map<string, Window>();
let lastSweep = Date.now();

function sweep(maxAgeMs: number) {
  if (Date.now() - lastSweep < 60_000) return;
  lastSweep = Date.now();
  const cutoff = Date.now() - maxAgeMs;
  for (const [key, win] of store) {
    win.timestamps = win.timestamps.filter((t) => t > cutoff);
    if (win.timestamps.length === 0) store.delete(key);
  }
}

/** Returns true if the action is allowed, false if rate-limited. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  sweep(windowMs * 2);
  const now = Date.now();
  const win = store.get(key) ?? { timestamps: [] };
  win.timestamps = win.timestamps.filter((t) => t > now - windowMs);
  if (win.timestamps.length >= limit) {
    store.set(key, win);
    return false;
  }
  win.timestamps.push(now);
  store.set(key, win);
  return true;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`kingbid:${ip}`).digest("hex").slice(0, 24);
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}
