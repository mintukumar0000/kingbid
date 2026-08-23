"use client";

import { useState } from "react";
import { siteUrl } from "@/lib/site";

export function BadgeEmbedSnippet({
  listingId,
  slug,
}: {
  listingId: string;
  slug: string;
}) {
  const base = siteUrl();
  const imgEmbed = `<a href="${base}/l/${slug}"><img src="${base}/api/badge/${listingId}" alt="KingBid rank badge" width="220" height="48" /></a>`;
  const scriptEmbed = `<script src="${base}/widget.js" data-slug="${slug}"></script>`;
  const [mode, setMode] = useState<"img" | "script">("img");
  const code = mode === "img" ? imgEmbed : scriptEmbed;

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("img")}
          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
            mode === "img" ? "bg-accent text-white" : "border border-border"
          }`}
        >
          Image badge
        </button>
        <button
          type="button"
          onClick={() => setMode("script")}
          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
            mode === "script" ? "bg-accent text-white" : "border border-border"
          }`}
        >
          Script widget
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] text-muted">
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="mt-2 text-[13px] font-medium text-accent hover:underline"
    >
      {copied ? "Copied!" : "Copy embed code"}
    </button>
  );
}
