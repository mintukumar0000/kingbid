"use client";

import { useTheme } from "@/components/ThemeProvider";

/** Fixed theme toggle — bottom-right, off the nav bar. */
export function ThemeToggleFab() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-[0_8px_32px_rgba(28,25,23,0.12)] transition-colors hover:border-accent"
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 14.3A9 9 0 1 1 9.7 3a7 7 0 0 0 11.3 11.3z" />
        </svg>
      )}
    </button>
  );
}
