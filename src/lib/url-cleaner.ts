// URL cleaning + content policy enforcement.
//
// Rules implemented:
// - Query params + hash stripped from every URL (no tracking/affiliate links)
// - Link shorteners are auto-expanded to their final destination
// - Chat/invite links (Telegram, WhatsApp, Discord, Messenger, Signal) blocked
// - Sexual/NSFW content blocked (keyword heuristic)
// - X/Twitter @handles normalized to https://x.com/<handle>
// - App Store / Play Store / GitHub links keyed by path (different apps
//   don't share a listing); other sites keyed by host + path.

export class UrlPolicyError extends Error {}

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "is.gd",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "tiny.cc",
  "rb.gy",
  "s.id",
  "lnkd.in",
]);

const BLOCKED_CHAT_DOMAINS = [
  "t.me",
  "telegram.me",
  "telegram.org",
  "wa.me",
  "chat.whatsapp.com",
  "api.whatsapp.com",
  "discord.gg",
  "discord.com",
  "discordapp.com",
  "m.me",
  "messenger.com",
  "signal.me",
  "signal.group",
];

const NSFW_KEYWORDS = [
  "porn",
  "nsfw",
  "xxx",
  "adult",
  "sex",
  "escort",
  "hentai",
  "onlyfans",
  "fansly",
  "camgirl",
  "nude",
];

const X_HOSTS = new Set(["x.com", "twitter.com", "www.x.com", "www.twitter.com", "mobile.twitter.com"]);

// Sites where the PATH identifies a distinct product (apps must not share bids)
const PATH_KEYED_HOSTS = new Set([
  "apps.apple.com",
  "play.google.com",
  "github.com",
  "chromewebstore.google.com",
  "addons.mozilla.org",
]);

export interface CleanedTarget {
  /** Canonical unique key stored in DB, e.g. "https://orynth.dev" or "https://x.com/handle" */
  url: string;
  /** Pretty label for the leaderboard */
  displayUrl: string;
  kind: "website" | "x_handle";
  handle: string | null;
}

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith("." + domain);
}

function assertAllowed(url: URL): void {
  const host = url.hostname.toLowerCase();
  if (BLOCKED_CHAT_DOMAINS.some((d) => hostMatches(host, d))) {
    throw new UrlPolicyError("Chat / invite links (Telegram, WhatsApp, Discord, Messenger, Signal) are not allowed.");
  }
  const haystack = (host + url.pathname).toLowerCase();
  if (NSFW_KEYWORDS.some((k) => haystack.includes(k))) {
    throw new UrlPolicyError("Adult / NSFW content is not allowed.");
  }
}

async function expandShortener(url: URL, depth = 0): Promise<URL> {
  if (depth > 5) throw new UrlPolicyError("Too many redirects while expanding short link.");
  if (!SHORTENERS.has(url.hostname.toLowerCase())) return url;
  try {
    const res = await fetch(url.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    const finalUrl = new URL(res.url);
    if (SHORTENERS.has(finalUrl.hostname.toLowerCase())) {
      return expandShortener(finalUrl, depth + 1);
    }
    return finalUrl;
  } catch (e) {
    if (e instanceof UrlPolicyError) throw e;
    throw new UrlPolicyError("Could not expand short link. Please submit the final destination URL directly.");
  }
}

const HANDLE_RE = /^@?([A-Za-z0-9_]{1,15})$/;

/**
 * Accepts a raw user input (URL, bare domain, or @handle) and returns the
 * canonical cleaned target, or throws UrlPolicyError.
 */
export async function cleanTarget(rawInput: string): Promise<CleanedTarget> {
  const input = rawInput.trim();
  if (!input) throw new UrlPolicyError("Please enter a URL or @handle.");

  // Bare X handle, e.g. "@jonathan_wilke"
  const handleMatch = input.match(HANDLE_RE);
  if (handleMatch && input.startsWith("@")) {
    const handle = handleMatch[1];
    return {
      url: `https://x.com/${handle.toLowerCase()}`,
      displayUrl: `@${handle} on X`,
      kind: "x_handle",
      handle: `@${handle}`,
    };
  }

  // Normalize to a URL (prepend https:// for bare domains)
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    throw new UrlPolicyError("That doesn't look like a valid URL or @handle.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UrlPolicyError("Only http(s) links are allowed.");
  }

  // Expand shorteners to final destination, then re-check policy
  url = await expandShortener(url);
  assertAllowed(url);

  // Strip tracking: no query params, no hash
  url.search = "";
  url.hash = "";

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  // X profile URL -> handle listing
  if (X_HOSTS.has(url.hostname.toLowerCase())) {
    const seg = url.pathname.split("/").filter(Boolean)[0] ?? "";
    const m = seg.match(HANDLE_RE);
    if (!m) throw new UrlPolicyError("Only X profile links are allowed (x.com/yourhandle).");
    const handle = m[1];
    return {
      url: `https://x.com/${handle.toLowerCase()}`,
      displayUrl: `@${handle} on X`,
      kind: "x_handle",
      handle: `@${handle}`,
    };
  }

  // Path-keyed hosts keep their full path; everything else keeps host + path
  let path = url.pathname.replace(/\/+$/, "");
  if (!PATH_KEYED_HOSTS.has(host) && (path === "" || path === "/")) {
    path = "";
  }

  const canonical = `https://${host}${path}`;
  const display = `${host}${PATH_KEYED_HOSTS.has(host) ? path : ""}`;

  return { url: canonical, displayUrl: display, kind: "website", handle: null };
}
