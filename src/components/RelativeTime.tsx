"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

/** Renders relative time only after mount so SSR and client clocks never mismatch. */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => setLabel(timeAgo(date));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [date]);

  if (!label) return <span className={className}>&nbsp;</span>;
  return <span className={className}>{label}</span>;
}
