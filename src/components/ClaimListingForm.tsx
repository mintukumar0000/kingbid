"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

export function ClaimListingForm({
  token,
  categorySlug,
}: {
  token: string;
  categorySlug: string | null;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(5);
  const [alerts, setAlerts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, url, title, email, amount, alerts, categorySlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start claim.");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Your URL or @handle</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className={field} required />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} required />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Opening bid (USD)</label>
        <input
          type="number"
          min={5}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value || "5", 10))}
          className={field}
        />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        <input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />
        Email me when someone outbids me
      </label>
      {error && <p className="text-sm text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent py-3 font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Redirecting…" : `Pay ${formatMoney(amount)} & list`}
      </button>
    </form>
  );
}
