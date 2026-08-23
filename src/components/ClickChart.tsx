export function ClickChart({ timeline }: { timeline: { date: string; count: number }[] }) {
  const max = Math.max(1, ...timeline.map((d) => d.count));

  if (timeline.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        0 clicks in the last 30 days — traffic is tracked when visitors use the board link.
      </p>
    );
  }

  return (
    <div className="flex h-32 items-end gap-1">
      {timeline.map((d) => (
        <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-accent/80"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
            title={`${d.date}: ${d.count} clicks`}
          />
          <span className="tabular w-full truncate text-center text-[9px] text-muted">
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}
