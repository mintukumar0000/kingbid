"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { referralCookieName } from "@/lib/referral";

/** Persist ?ref=slug in a cookie so the next bid credits the referrer. */
export function ReferralTracker() {
  const params = useSearchParams();
  const ref = params.get("ref");

  useEffect(() => {
    if (!ref?.trim()) return;
    const name = referralCookieName();
    document.cookie = `${name}=${encodeURIComponent(ref.trim().toLowerCase())};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
  }, [ref]);

  return null;
}
