/** URL-safe slug for /l/[slug], embed widget, and ?ref= links. */
export function slugFromDisplayUrl(displayUrl: string, handle?: string | null): string {
  if (handle) return handle.replace(/^@/, "").toLowerCase();
  const base = displayUrl.toLowerCase().replace(/^@/, "").split(" on ")[0] ?? displayUrl;
  return base
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = base || "listing";
  let n = 0;
  while (await exists(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
