"use client";

import type { CrownState, DethronementFeedItem } from "@/lib/crowns-data";
import { CROWN_DISCLAIMER } from "@/lib/crowns";
import { formatMoney } from "@/lib/format";
import { CrownLiveTable } from "@/components/crowns/CrownLiveTable";
import { RelativeTime } from "@/components/RelativeTime";
import Link from "next/link";

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

export function CrownsTrending({
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
        eyebrow="Momentum"
        title="Trending crowns"
        description="Most bid activity in the last 24 hours."
      />
      <div className="mt-6">
        <CrownLiveTable crowns={crowns} onSteal={onClaim} showToday />
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
      <div className="mt-6">
        <CrownLiveTable crowns={crowns} onSteal={onClaim} />
      </div>
    </section>
  );
}

export function CrownsKingdomMap({
  crowns,
  onClaim,
}: {
  crowns: CrownState[];
  onClaim: (c: CrownState) => void;
}) {
  if (!crowns.length) return null;

  return (
    <section id="kingdom" className="crowns-section">
      <SectionHead
        eyebrow="Territories"
        title="The kingdom"
        description="Places crowns — fictional digital titles, not real-world sovereignty."
      />
      <div className="mt-6">
        <CrownLiveTable crowns={crowns} onSteal={onClaim} />
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
      <div className="crown-live-table mt-6">
        <div className="crown-table-header hidden md:grid" style={{ gridTemplateColumns: "1.2fr 1.5fr 0.8fr 100px" }}>
          <span>Crown</span>
          <span>Change</span>
          <span>Bids</span>
          <span>When</span>
        </div>
        <div className="crown-table-section">
          {items.map((d, i) => (
            <div key={`${d.at}-${i}`} className="crown-table-row crown-table-row-static">
              <div
                className="crown-table-row-inner hidden md:grid"
                style={{ gridTemplateColumns: "1.2fr 1.5fr 0.8fr 100px" }}
              >
                <Link href={`/crown/${d.crownSlug}`} className="font-semibold text-[var(--crown-gold)] hover:underline">
                  {d.crownName}
                </Link>
                <span className="truncate text-[13px] text-muted">
                  {d.previousKing} → <span className="text-foreground">{d.newKing}</span>
                </span>
                <span className="font-mono-label text-[13px] tabular text-muted">
                  {formatMoney(d.previousBid)} → {formatMoney(d.newBid)}
                </span>
                <span className="text-[12px] text-muted">
                  <RelativeTime date={d.at} />
                </span>
              </div>
              <div className="md:hidden space-y-1 px-4 py-3">
                <Link href={`/crown/${d.crownSlug}`} className="font-semibold text-[var(--crown-gold)]">
                  {d.crownName}
                </Link>
                <p className="text-[13px] text-muted">
                  {d.previousKing} → {d.newKing}
                </p>
                <p className="font-mono-label text-[12px] tabular text-muted">
                  {formatMoney(d.previousBid)} → {formatMoney(d.newBid)} · <RelativeTime date={d.at} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
