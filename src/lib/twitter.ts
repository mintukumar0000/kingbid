import { createHmac, randomBytes } from "crypto";

function enabled(): boolean {
  return (
    process.env.TWITTER_ENABLED === "true" &&
    !!process.env.TWITTER_API_KEY &&
    !!process.env.TWITTER_API_SECRET &&
    !!process.env.TWITTER_ACCESS_TOKEN &&
    !!process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

function oauthHeader(method: string, url: string, body?: string): string {
  const key = process.env.TWITTER_API_KEY!;
  const secret = process.env.TWITTER_API_SECRET!;
  const token = process.env.TWITTER_ACCESS_TOKEN!;
  const tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET!;

  const oauth: Record<string, string> = {
    oauth_consumer_key: key,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const params = new URLSearchParams({ ...oauth }).toString();
  const base = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(params)}`;
  const signingKey = `${encodeURIComponent(secret)}&${encodeURIComponent(tokenSecret)}`;
  oauth.oauth_signature = createHmac("sha1", signingKey).update(base).digest("base64");

  return (
    "OAuth " +
    Object.entries(oauth)
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

/** Post when #1 changes. No-ops when Twitter env is not configured. */
export async function tweetTopSpotChange(displayUrl: string, totalBid: number): Promise<void> {
  if (!enabled()) {
    console.log(`[twitter:mock] #1 changed: ${displayUrl} at $${totalBid}`);
    return;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingbid.lol";
  const text = `${displayUrl} just took #1 for $${totalBid.toLocaleString()} on kingbid.lol 👑\n${site}`;

  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: oauthHeader("POST", "https://api.twitter.com/2/tweets", JSON.stringify({ text })),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) console.error("[twitter] post failed:", await res.text());
  } catch (e) {
    console.error("[twitter] post error:", e);
  }
}
