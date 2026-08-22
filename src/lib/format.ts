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
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
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

/** Human-readable time since platform launch. */
export function formatLaunchAge(launchedAt: string): string {
  const ms = Date.now() - new Date(launchedAt).getTime();
  if (ms < 60_000) return "just now";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "less than an hour ago";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
