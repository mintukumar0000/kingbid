// Digital Crowns — 14 launch crowns mapped to existing board mechanics.

export type CrownGroup = "tech" | "places" | "internet";
export type CrownTheme = "tech" | "places" | "internet";

export interface CrownDefinition {
  slug: string;
  name: string;
  headline: string;
  group: CrownGroup;
  theme: CrownTheme;
  /** category = per-category board; local = country board; global = internet-wide */
  scope: "category" | "local" | "global";
  categorySlug?: string;
  countryCode?: string;
  flag?: string;
  description: string;
  disclaimer?: string;
}

export const CROWN_DISCLAIMER =
  "KingBid territories and platform crowns are fictional digital titles within KingBid. They do not represent ownership, sovereignty, territorial rights, government affiliation, or endorsement.";

export const CROWNS: CrownDefinition[] = [
  {
    slug: "king-of-ai",
    name: "King of AI",
    headline: "KING OF AI",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-ai",
    description: "The highest bid holds the AI crown until someone steals it.",
  },
  {
    slug: "king-of-saas",
    name: "King of SaaS",
    headline: "KING OF SAAS",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-saas",
    description: "Rule the SaaS vertical. Highest valid bid wins.",
  },
  {
    slug: "king-of-startups",
    name: "King of Startups",
    headline: "KING OF STARTUPS",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-startups",
    description: "The startup crown goes to whoever bids the most.",
  },
  {
    slug: "king-of-developers",
    name: "King of Developers",
    headline: "KING OF DEVELOPERS",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-developers",
    description: "Dev tools, infra, and builder products compete here.",
  },
  {
    slug: "king-of-coding",
    name: "King of Coding",
    headline: "KING OF CODING",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-coding",
    description: "Copilots, IDEs, and coding assistants battle for #1.",
  },
  {
    slug: "king-of-design",
    name: "King of Design",
    headline: "KING OF DESIGN",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-design",
    description: "Design tools and creative studios claim the crown.",
  },
  {
    slug: "king-of-marketing",
    name: "King of Marketing",
    headline: "KING OF MARKETING",
    group: "tech",
    theme: "tech",
    scope: "category",
    categorySlug: "king-of-marketing",
    description: "Growth, ads, and marketing products fight for the throne.",
  },
  {
    slug: "king-of-usa",
    name: "King of USA",
    headline: "KING OF USA",
    group: "places",
    theme: "places",
    scope: "local",
    countryCode: "US",
    flag: "🇺🇸",
    description: "A fictional KingBid digital title for the USA region.",
    disclaimer: CROWN_DISCLAIMER,
  },
  {
    slug: "king-of-india",
    name: "King of India",
    headline: "KING OF INDIA",
    group: "places",
    theme: "places",
    scope: "local",
    countryCode: "IN",
    flag: "🇮🇳",
    description: "A fictional KingBid digital title for the India region.",
    disclaimer: CROWN_DISCLAIMER,
  },
  {
    slug: "king-of-nepal",
    name: "King of Nepal",
    headline: "KING OF NEPAL",
    group: "places",
    theme: "places",
    scope: "local",
    countryCode: "NP",
    flag: "🇳🇵",
    description: "A fictional KingBid digital title for the Nepal region.",
    disclaimer: CROWN_DISCLAIMER,
  },
  {
    slug: "king-of-uk",
    name: "King of UK",
    headline: "KING OF UK",
    group: "places",
    theme: "places",
    scope: "local",
    countryCode: "GB",
    flag: "🇬🇧",
    description: "A fictional KingBid digital title for the UK region.",
    disclaimer: CROWN_DISCLAIMER,
  },
  {
    slug: "king-of-x",
    name: "King of X",
    headline: "KING OF X",
    group: "internet",
    theme: "internet",
    scope: "category",
    categorySlug: "king-of-x",
    description: "Internet culture crown — not affiliated with X Corp.",
  },
  {
    slug: "king-of-threads",
    name: "King of Threads",
    headline: "KING OF THREADS",
    group: "internet",
    theme: "internet",
    scope: "category",
    categorySlug: "king-of-threads",
    description: "Social crown for the threads era — not platform-endorsed.",
  },
  {
    slug: "king-of-the-internet",
    name: "King of the Internet",
    headline: "KING OF THE INTERNET",
    group: "internet",
    theme: "internet",
    scope: "global",
    description: "The ultimate crown. Global board, highest bid wins.",
  },
];

export function getCrown(slug: string): CrownDefinition | undefined {
  return CROWNS.find((c) => c.slug === slug);
}

export function crownBidParams(crown: CrownDefinition): {
  scope: "global" | "local";
  categorySlug?: string;
  countryCode?: string;
} {
  if (crown.scope === "local") {
    return { scope: "local", countryCode: crown.countryCode };
  }
  if (crown.scope === "category" && crown.categorySlug) {
    return { scope: "global", categorySlug: crown.categorySlug };
  }
  return { scope: "global" };
}
