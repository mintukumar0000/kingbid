"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

export default function ManageAlertsPage() {
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/alerts?email=${encodeURIComponent(email)}&slug=${encodeURIComponent(slug)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load alerts.");
        setSubscribed(null);
        setLoading(false);
        return;
      }
      setSubscribed(data.subscribed);
      setListingTitle(data.listing?.displayUrl ?? null);
      setLoading(false);
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, listingSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update alerts.");
        setLoading(false);
        return;
      }
      setSubscribed(data.subscribed);
      setLoading(false);
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-md py-12`}>
        <h1 className="text-2xl font-bold">Manage outbid alerts</h1>
        <p className="mt-2 text-[13px] text-muted">
          Use the same email you listed with. We only email when someone outbids you — no spam.
        </p>

        <form onSubmit={lookup} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Listing slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="your-listing-slug"
              className={field}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Owner email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              required
            />
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent py-3 font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Look up"}
          </button>
        </form>

        {subscribed !== null && listingTitle && (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
            <p className="text-[14px]">
              Alerts for <span className="font-semibold">{listingTitle}</span> are{" "}
              <span className="font-semibold">{subscribed ? "on" : "off"}</span>.
            </p>
            <button
              type="button"
              onClick={toggle}
              disabled={loading}
              className="mt-4 w-full rounded-full border border-border py-2.5 text-[13px] font-semibold hover:border-accent"
            >
              {subscribed ? "Turn off alerts" : "Turn on alerts"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
