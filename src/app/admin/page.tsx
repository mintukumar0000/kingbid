"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { formatMoney } from "@/lib/format";
import { RelativeTime } from "@/components/RelativeTime";
import { AdminInvitesPanel } from "@/components/AdminInvitesPanel";

interface AdminBid {
  id: string;
  listing: string;
  displayUrl: string;
  amount: number;
  totalAfter: number;
  status: string;
  isTakeover: boolean;
  email: string | null;
  paymentId: string;
  createdAt: string;
}

interface AdminData {
  revenue: number;
  pendingCount: number;
  failedCount: number;
  totalListings: number;
  recentBids: AdminBid[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green",
  pending: "text-accent",
  failed: "text-red",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin", { headers: { "x-admin-password": password } });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) return setError(d.error ?? "Login failed");
    setData(d);
  }

  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>

        {!data ? (
          <form onSubmit={login} className="mt-8 max-w-sm space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
            {error && <p className="text-sm text-red">{error}</p>}
            <button
              disabled={loading}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {loading ? "Checking…" : "Unlock"}
            </button>
          </form>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Revenue</p>
                <p className="tabular mt-1 text-2xl font-extrabold text-accent">{formatMoney(data.revenue)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Pending payments</p>
                <p className="tabular mt-1 text-2xl font-extrabold">{data.pendingCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Failed payments</p>
                <p className="tabular mt-1 text-2xl font-extrabold">{data.failedCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Total listings</p>
                <p className="tabular mt-1 text-2xl font-extrabold">{data.totalListings}</p>
              </div>
            </div>

            <h2 className="mt-10 text-lg font-bold">Recent bids (all statuses)</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Total after</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBids.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-4 py-2.5">
                        <span className="font-semibold">{b.listing}</span>
                        {b.isTakeover && <span className="ml-1.5 text-xs text-accent">🔒 takeover</span>}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right">{formatMoney(b.amount)}</td>
                      <td className="tabular px-4 py-2.5 text-right text-muted">
                        {b.totalAfter > 0 ? formatMoney(b.totalAfter) : "—"}
                      </td>
                      <td className={`px-4 py-2.5 font-semibold ${STATUS_COLORS[b.status] ?? ""}`}>{b.status}</td>
                      <td className="px-4 py-2.5 text-muted">{b.email ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted whitespace-nowrap">
                        <RelativeTime date={b.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminInvitesPanel password={password} />
          </>
        )}
      </div>
    </main>
  );
}
