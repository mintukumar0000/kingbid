"use client";

import Link from "next/link";
import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownState, DethronementFeedItem } from "@/lib/crowns-data";
import { crownVisual } from "@/lib/crown-visuals";
import { CROWN_DISCLAIMER } from "@/lib/crowns";
import { RelativeTime } from "@/components/RelativeTime";

function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="crowns-section-head">
      <p className="kb-eyebrow">{eyebrow}</p>
      <h2 className="font-display mt-1 text-[24px] font-semibold tracking-tight sm:text-[28px]">{title}</h2>
      {description && <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function CrownsTrending({ crowns }: { crowns: CrownState[] }) {
  if (!crowns.length) return null;

  return (
    <section className="crowns-section">
      <SectionHead
        eyebrow="Momentum"
        title="Trending crowns"
        description="Most bid activity in the last 24 hours."
      />
      <div className="crowns-trending-track mt-6">
        {crowns.map((c, i) => {
          const visual = crownVisual(c.slug);
          return (
            <Link key={c.slug} href={`/crown/${c.slug}`} className="crowns-trending-card group">
              <span className="crowns-trending-rank">{i + 1}</span>
              <span className="crowns-trending-icon" style={{ color: visual.accent }}>
                {visual.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {c.hasKing ? c.kingHandle : "Throne open"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-label text-[15px] font-bold tabular" style={{ color: visual.accent }}>
                  +{formatMoney(c.bidDeltaToday)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted">today</p>
              </div>
              <span className="crowns-card-arrow" aria-hidden>
                →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CrownsMostWanted({
  crowns,
  onClaim,
}: {
  crowns: CrownState[];
  onClaim: (c: CrownState) => void;
}) {
  if (!crowns.length) return null;

  return (
    <section className="crowns-section">
      <SectionHead
        eyebrow="Opportunity"
        title="Most wanted"
        description="Hot thrones and open crowns worth claiming first."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {crowns.map((c) => {
          const visual = crownVisual(c.slug);
          return (
            <article
              key={c.slug}
              className="crowns-wanted-card group"
              style={
                {
                  "--crown-accent": visual.accent,
                  "--crown-accent-rgb": visual.accentRgb,
                } as React.CSSProperties
              }
            >
              <div className="flex items-start justify-between gap-2">
                <span className="crowns-wanted-icon">{visual.icon}</span>
                {c.isHot && <span className="crowns-pill crowns-pill-hot">Hot</span>}
                {!c.hasKing && !c.isHot && <span className="crowns-pill crowns-pill-open">Open</span>}
              </div>
              <Link href={`/crown/${c.slug}`} className="mt-3 block font-semibold hover:text-[var(--crown-gold)]">
                {c.name}
              </Link>
              <p className="mt-1 truncate text-[13px] text-muted">
                {c.hasKing ? c.kingHandle : "No king yet"}
              </p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="font-mono-label text-[22px] font-bold tabular leading-none" style={{ color: visual.accent }}>
                  {formatMoney(c.hasKing ? c.nextBid : c.nextBid)}
                </p>
                <button type="button" onClick={() => onClaim(c)} className="crowns-wanted-claim">
                  {c.hasKing ? "Outbid" : "Claim"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CrownsKingdomMap({ crowns }: { crowns: CrownState[] }) {
  if (!crowns.length) return null;

  return (
    <section id="kingdom" className="crowns-section">
      <SectionHead
        eyebrow="Territories"
        title="The kingdom"
        description="Places crowns — fictional digital titles, not real-world sovereignty."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {crowns.map((c) => {
          const visual = crownVisual(c.slug);
          return (
            <Link
              key={c.slug}
              href={`/crown/${c.slug}`}
              className="crowns-territory-card group"
              style={
                {
                  "--crown-accent": visual.accent,
                  "--crown-accent-rgb": visual.accentRgb,
                } as React.CSSProperties
              }
            >
              <span className="text-[32px] leading-none">{c.flag}</span>
              <p className="mt-3 font-semibold">{c.name}</p>
              {c.hasKing ? (
                <div className="mt-2 flex items-center gap-2">
                  {c.kingUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faviconFor(c.kingUrl)} alt="" width={20} height={20} className="rounded-md" />
                  )}
                  <p className="truncate text-[12px] text-muted">{c.kingHandle}</p>
                </div>
              ) : (
                <p className="mt-2 text-[12px] font-medium text-muted">Unclaimed throne</p>
              )}
              <p className="mt-3 font-mono-label text-[18px] font-bold tabular" style={{ color: visual.accent }}>
                {formatMoney(c.hasKing ? c.currentBid : c.nextBid)}
              </p>
            </Link>
          );
        })}
      </div>
      <p className="mt-5 max-w-2xl text-[11px] leading-relaxed text-muted/90">{CROWN_DISCLAIMER}</p>
    </section>
  );
}

export function CrownsDethronedFeed({ items }: { items: DethronementFeedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="crowns-section crowns-section-last">
      <SectionHead eyebrow="History" title="Recently dethroned" description="Kings who lost their spot." />
      <ul className="mt-6 space-y-2">
        {items.map((d, i) => (
          <li key={`${d.at}-${i}`} className="crowns-dethroned-row">
            <Link href={`/crown/${d.crownSlug}`} className="shrink-0 font-semibold text-[var(--crown-gold)] hover:underline">
              {d.crownName}
            </Link>
            <span className="hidden text-muted sm:inline">·</span>
            <span className="truncate text-[13px] text-muted">
              {d.previousKing} → <span className="text-foreground">{d.newKing}</span>
            </span>
            <span className="ml-auto shrink-0 font-mono-label text-[12px] tabular text-muted">
              {formatMoney(d.previousBid)} → {formatMoney(d.newBid)}
            </span>
            <span className="w-full text-[11px] text-muted sm:w-auto">
              <RelativeTime date={d.at} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
