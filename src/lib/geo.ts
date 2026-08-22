import { COUNTRY_COOKIE } from "@/lib/brand";

export type BoardScope = "global" | "local";

export { COUNTRY_COOKIE };

const DEV_COUNTRY = process.env.DEFAULT_COUNTRY_CODE ?? "US";

/** Common countries for the picker (ISO 3166-1 alpha-2). */
export const POPULAR_COUNTRIES = [
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "IN",
  "NP",
  "JP",
  "BR",
  "NG",
  "PK",
  "BD",
  "PH",
  "ID",
  "MX",
  "AE",
  "SG",
  "NL",
  "KR",
  "IT",
  "ES",
  "ZA",
  "KE",
  "GH",
] as const;

/** ISO 3166-1 alpha-2 from Vercel / Cloudflare / dev fallback. */
export function getCountryFromRequest(request: Request): string {
  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel && vercel !== "XX") return vercel.toUpperCase();
  const cf = request.headers.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf.toUpperCase();
  return DEV_COUNTRY;
}

export function getCountryFromHeaders(headerList: Headers): string {
  const vercel = headerList.get("x-vercel-ip-country");
  if (vercel && vercel !== "XX") return vercel.toUpperCase();
  const cf = headerList.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf.toUpperCase();
  return DEV_COUNTRY;
}

function countryFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COUNTRY_COOKIE}=([A-Za-z]{2})`));
  return match ? match[1].toUpperCase() : null;
}

function countryFromQuery(url: string): string | null {
  try {
    const param = new URL(url).searchParams.get("country");
    if (param && /^[A-Za-z]{2}$/.test(param)) return param.toUpperCase();
  } catch {}
  return null;
}

/** User-selected country (cookie/query) wins over IP geo. */
export function resolveCountryCode(request: Request): string {
  const cookie = countryFromCookie(request.headers.get("cookie"));
  if (cookie) return cookie;
  const query = countryFromQuery(request.url);
  if (query) return query;
  return getCountryFromRequest(request);
}

/**
 * Country for Dodo checkout billing — uses IP geo, not the board-viewing cookie.
 * Local bids use the board country; global bids use where the visitor actually is.
 */
export function getCheckoutCountryCode(
  request: Request,
  scope: BoardScope,
  localBoardCountry: string | null
): string {
  if (scope === "local" && localBoardCountry) return localBoardCountry;
  return getCountryFromRequest(request);
}

export function countryDisplayName(code: string): string {
  if (!code || code === "XX") return "your region";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional indicator flag emoji, e.g. NP → 🇳🇵 */
export function countryFlagEmoji(code: string): string {
  if (!code || code.length !== 2 || code === "XX") return "🌍";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0))
  );
}

export function parseScope(value: string | null | undefined): BoardScope {
  return value === "local" ? "local" : "global";
}

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}
