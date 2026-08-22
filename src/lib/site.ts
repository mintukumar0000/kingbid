export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function listingUrl(slug: string): string {
  return `${siteUrl()}/l/${encodeURIComponent(slug)}`;
}

export function successUrl(paymentId: string): string {
  return `${siteUrl()}/success/${encodeURIComponent(paymentId)}`;
}

export function ogClaimUrl(rank: number, amount: number, name: string): string {
  const params = new URLSearchParams({
    rank: String(rank),
    amount: String(amount),
    name,
  });
  return `${siteUrl()}/api/og?${params}`;
}
