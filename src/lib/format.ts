export function formatMoney(dollars: number): string {
  return "$" + dollars.toLocaleString("en-US");
}

/** Hero headline price — no comma separators, like kingbid.lol ($13010). */
export function formatMoneyPlain(dollars: number): string {
  return "$" + dollars.toString();
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}

export function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

/** Outbound click URL — adds our referral tag like kingbid.lol does. Storage stays clean. */
export function outboundUrl(canonicalUrl: string): string {
  const tag = process.env.NEXT_PUBLIC_UTM_SOURCE ?? "kingbid";
  try {
    const u = new URL(canonicalUrl);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", tag);
    return u.toString();
  } catch {
    return canonicalUrl;
  }
}

/** Hours since platform launch — always hour-based, never "yesterday". */
export function formatLaunchAge(launchedAt: string): string {
  const ms = Date.now() - new Date(launchedAt).getTime();
  if (ms < 60_000) return "less than 1 hour";
  const hours = Math.floor(ms / 3_600_000);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** e.g. August 21st, 2026, at 10:06 PM */
export function formatLaunchDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = Number(get("day"));
  return `${get("month")} ${ordinal(day)}, ${get("year")}, at ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}
