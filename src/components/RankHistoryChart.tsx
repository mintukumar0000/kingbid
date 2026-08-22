"use client";

interface Point {
  at: string;
  totalAfter: number;
}

export function RankHistoryChart({ history }: { history: Point[] }) {
  if (history.length < 2) {
    return (
      <p className="text-[13px] text-muted">
        Rank history appears after your second bid. Keep raising to climb.
      </p>
    );
  }

  const width = 560;
  const height = 160;
  const pad = 24;
  const maxY = Math.max(...history.map((h) => h.totalAfter));
  const minY = Math.min(...history.map((h) => h.totalAfter));
  const range = Math.max(maxY - minY, 1);

  const points = history.map((h, i) => {
    const x = pad + (i / (history.length - 1)) * (width - pad * 2);
    const y = height - pad - ((h.totalAfter - minY) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xl text-accent" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
        {history.map((h, i) => {
          const x = pad + (i / (history.length - 1)) * (width - pad * 2);
          const y = height - pad - ((h.totalAfter - minY) / range) * (height - pad * 2);
          return <circle key={h.at} cx={x} cy={y} r="4" fill="currentColor" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted tabular">
        <span>${minY.toLocaleString()}</span>
        <span>${maxY.toLocaleString()}</span>
      </div>
    </div>
  );
}
