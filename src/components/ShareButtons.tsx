"use client";

import { useState } from "react";
import { listingUrl, siteUrl } from "@/lib/site";

interface Props {
  text: string;
  url?: string;
  slug?: string;
}

export function ShareButtons({ text, url, slug }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    url ??
    (slug ? listingUrl(slug) + `?ref=${encodeURIComponent(slug)}` : siteUrl());
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href={tweet}
        target="_blank"
        rel="noopener"
        className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition-colors"
      >
        𝕏 Share on X
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent transition-colors"
      >
        {copied ? "✓ Copied!" : "Copy referral link"}
      </button>
    </div>
  );
}
