import Link from "next/link";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

const PHASES = [
  {
    id: "p0",
    title: "Phase 0 — Trust basics",
    note: "Blocks everything else. Fix these before testing later phases.",
    items: [
      "Load the homepage logged out. Online/visitor counter shows a real number, not \"—\".",
      "The revenue-since-launch figure shows a real, non-placeholder number.",
      "Homepage and /rules copy read as original KingBid voice, not a close paraphrase of competitors.",
      "Empty states say \"0 listings — be the first\" (or similar), never a blank or misleading dash.",
    ],
  },
  {
    id: "p1",
    title: "Phase 1 — Rooms, Keepers, Reigns, Underdog",
    items: [
      "Enter a category room (?room=slug). Leaderboard, keeper, counts show real DB numbers.",
      "Submitting to a room requires your own claim/bid — nothing appears without your action.",
      "Room with keeper: profile shows rooms curated, member count, products discovered.",
      "Take #1 in a room: previous #1 shows closed reign with duration on listing/history.",
      "Listing history page keeps old reigns permanently after dethronement.",
      "Reclaim #1 twice: second takeover logs a comeback.",
      "Claim with revenue band + small bid: appears on Underdog row as unverified.",
      "Underdog ranking differs from money ranking (sacrifice score, not bid alone).",
      "No exact revenue figures public — bands only.",
    ],
  },
  {
    id: "p2",
    title: "Phase 2 — Momentum, Rivals, Notifications, Kingmaker",
    items: [
      "Bid up a listing quickly — appears in Breakout/Momentum within refresh window.",
      "Add a rival in Founder Hub — daily cron alert references rival by name and gap.",
      "Get outbid — notification is specific (rank change + dollar gap), not generic.",
      "Call It in Founder Hub — no payment screen; resolves at midnight UTC.",
      "Correct Call It prediction increases Kingmaker score.",
    ],
  },
  {
    id: "p3",
    title: "Phase 3 — Community, profiles, badges",
    items: [
      "Public profile shows reigns, dethronements, comebacks, Kingmaker score.",
      "Embed badge snippet renders with correct live rank.",
    ],
  },
  {
    id: "p4",
    title: "Phase 4 — Fallen Fund",
    items: [
      "Weekly pool accrues from platform revenue — not from any user's lost bid.",
      "Recipients follow published rule (underdog score + dethronement) — no random draw.",
      "Grants are visibility-only — no cash transfer code path.",
    ],
  },
  {
    id: "p5",
    title: "Phase 5 — Monetization & migration",
    items: [
      "Founder Pro / Room Pro checkout via Dodo unlocks paid features after webhook.",
      "Migration claim badge reads as self-reported — never \"official import\".",
    ],
  },
  {
    id: "cross",
    title: "Cross-cutting",
    items: [
      "Simultaneous bids on same #1 resolve without double-win or corrupt totals.",
      "Unowned product URL without claim link is rejected or requires verification.",
      "No invented stats, testimonials, or fake viewer counts anywhere on the live site.",
    ],
  },
];

export default function VerifyPage() {
  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <p className="kb-eyebrow">Quality assurance</p>
        <h1 className="font-display mt-2 text-[32px] font-semibold">Verification checklist</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Click through each item in order. Phases depend on earlier ones — if Phase 0 fails, fix trust basics
          before testing Kingmaker or Fallen Fund.
        </p>

        <div className="mt-8 space-y-8">
          {PHASES.map((phase) => (
            <section key={phase.id} className="bracket-card">
              <h2 className="font-display text-[20px] font-semibold">{phase.title}</h2>
              {phase.note && <p className="mt-1 text-[13px] text-accent">{phase.note}</p>}
              <ul className="mt-4 space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed">
                    <span className="mt-0.5 shrink-0 text-muted" aria-hidden>
                      ☐
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-muted">
          Full spec copy also lives in{" "}
          <Link href="https://github.com/mintukumar0000/kingbid/blob/main/VERIFICATION.md" className="text-accent hover:underline">
            VERIFICATION.md
          </Link>
          . Start testing from{" "}
          <Link href="/#claim" className="text-accent hover:underline">
            Claim a spot
          </Link>{" "}
          or{" "}
          <Link href="/founders" className="text-accent hover:underline">
            Founder Hub
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
