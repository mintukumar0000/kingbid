"use client";

import { REVENUE_BANDS, REVENUE_BAND_LABELS, type RevenueBand } from "@/lib/revenue-bands";

export function RevenueBandSelect({
  value,
  onChange,
  required = false,
}: {
  value: RevenueBand | "";
  onChange: (band: RevenueBand) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">
        Monthly revenue band {required ? "(required for Underdog rank)" : "(optional)"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RevenueBand)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
        required={required}
      >
        <option value="" disabled>
          Select a band…
        </option>
        {REVENUE_BANDS.map((band) => (
          <option key={band} value={band}>
            {REVENUE_BAND_LABELS[band]} (unverified)
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] text-muted">
        Self-reported bands are labeled unverified until you connect Stripe/Lemon Squeezy later.
      </p>
    </div>
  );
}
