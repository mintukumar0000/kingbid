"use client";

import { useEffect, useRef, useState } from "react";
import {
  COUNTRY_COOKIE,
  POPULAR_COUNTRIES,
  countryDisplayName,
  countryFlagEmoji,
} from "@/lib/geo";

interface Props {
  value: string;
  detectedCountry: string;
  onChange: (code: string) => void;
}

export function CountryPicker({ value, detectedCountry, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isOverride = value !== detectedCountry;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground shadow-[var(--shadow)] hover:border-accent transition-colors"
      >
        <span aria-hidden>{countryFlagEmoji(value)}</span>
        <span>{countryDisplayName(value)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOverride && (
        <p className="mt-1.5 text-center text-[11px] text-muted">
          Viewing {countryDisplayName(value)} board
          {detectedCountry !== value && (
            <>
              {" "}
              ·{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => {
                  document.cookie = `${COUNTRY_COOKIE}=;path=/;max-age=0`;
                  onChange(detectedCountry);
                }}
              >
                use detected ({countryDisplayName(detectedCountry)})
              </button>
            </>
          )}
        </p>
      )}

      {open && (
        <div className="absolute left-1/2 z-50 mt-2 max-h-64 w-56 -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {POPULAR_COUNTRIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                document.cookie = `${COUNTRY_COOKIE}=${code};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
                onChange(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-surface-2 ${
                code === value ? "font-semibold text-accent" : "text-foreground"
              }`}
            >
              <span>{countryFlagEmoji(code)}</span>
              <span>{countryDisplayName(code)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
