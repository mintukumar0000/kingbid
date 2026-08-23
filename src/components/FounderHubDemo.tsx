/** Static UI previews — shown when live data is empty so founders understand each feature. */
export const FOUNDER_FEATURE_DEMOS = {
  discovery: {
    title: "Example discovery bet",
    rows: [
      { label: "nestly.io", meta: "Predicted #1 in AI Builders · +214% momentum" },
      { label: "flowpay.io", meta: "Predicted top 3 in Fintech · unverified band" },
    ],
    hint: "Add real slugs from the live leaderboard. When they hit #1, your Kingbid Score rises.",
  },
  rivals: {
    title: "Example rival alert",
    rows: [{ label: "yourapp.io vs flowpay.io", meta: "You're $26 ahead · alert if they close the gap" }],
    hint: "Track up to 5 rivals per listing. Daily cron sends game-style gap alerts.",
  },
  callIt: {
    title: "Example Call It",
    rows: [{ label: "Tonight's #1 in Dev Sanctum", meta: "You picked nestly.io · resolves midnight UTC · no payment" }],
    hint: "Free prediction on a room's end-of-day #1. Correct calls boost Kingmaker score.",
  },
  keeper: {
    title: "Example keeper progress",
    rows: [
      { label: "Scout", meta: "3 discovery picks logged" },
      { label: "Keeper", meta: "Curating AI Builders · Score 24" },
    ],
    hint: "Levels are earned — Member → Scout → Keeper → Senior → Legendary.",
  },
  underdog: {
    title: "Example underdog row",
    rows: [{ label: "loopwise.io", meta: "11.2× sacrifice · $1K–$10K/mo band · unverified" }],
    hint: "Rank by conviction (bid ÷ revenue band), not dollars alone.",
  },
  fallenFund: {
    title: "Example Fallen Fund grant",
    rows: [{ label: "trace.io", meta: "Visibility spotlight · funded from platform revenue, not lost bids" }],
    hint: "Weekly grants are visibility-only — never cash payouts.",
  },
} as const;

export function DemoPreview({
  title,
  rows,
  hint,
}: {
  title: string;
  rows: ReadonlyArray<{ label: string; meta: string }>;
  hint: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/60 p-4">
      <p className="kb-eyebrow !text-[10px]">Preview</p>
      <p className="mt-1 text-[13px] font-semibold text-foreground/80">{title}</p>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-[12.5px]">
            <span className="font-medium text-muted">{r.label}</span>
            <span className="mt-0.5 block text-[11.5px] text-muted/90">{r.meta}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
