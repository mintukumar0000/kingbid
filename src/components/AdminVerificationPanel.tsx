"use client";

import { useCallback, useEffect, useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";

interface VerificationRequest {
  id: string;
  email: string;
  name: string;
  message: string;
  paymentPublicId: string | null;
  listingUrl: string | null;
  status: string;
  adminNotes: string;
  createdAt: string;
  repliedAt: string | null;
}

export function AdminVerificationPanel({ password }: { password: string }) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/nepal-verification", {
      headers: { "x-admin-password": password },
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setRequests(data.requests ?? []);
      setPendingCount(data.pendingCount ?? 0);
    }
  }, [password]);

  useEffect(() => {
    load();
  }, [load]);

  async function markReplied(id: string) {
    const res = await fetch("/api/admin/nepal-verification", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id,
        status: "replied",
        adminNotes: notes[id] ?? "",
      }),
    });
    if (res.ok) await load();
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          Verification requests
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[12px] font-semibold text-white">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={load}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          Refresh
        </button>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        Payers who request campaign proof. Reply to their email manually, then mark as replied here.
      </p>

      {loading ? (
        <p className="mt-4 text-[13px] text-muted">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">No verification requests yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 ${
                r.status === "pending" ? "border-accent/40 bg-accent-soft/20" : "border-border bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.email}</p>
                  {r.name && <p className="text-[13px] text-muted">{r.name}</p>}
                </div>
                <span
                  className={`text-[12px] font-semibold uppercase ${
                    r.status === "pending" ? "text-accent" : "text-green"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-[13px] text-muted">
                {r.paymentPublicId && (
                  <div>
                    <dt className="inline font-medium text-foreground">Transaction: </dt>
                    <dd className="inline font-mono-label">{r.paymentPublicId}</dd>
                  </div>
                )}
                {r.listingUrl && (
                  <div>
                    <dt className="inline font-medium text-foreground">Listing: </dt>
                    <dd className="inline">{r.listingUrl}</dd>
                  </div>
                )}
                {r.message && (
                  <div>
                    <dt className="font-medium text-foreground">Message</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">{r.message}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium text-foreground">Submitted </dt>
                  <dd className="inline">
                    <RelativeTime date={r.createdAt} />
                  </dd>
                </div>
              </dl>
              {r.status === "pending" && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="Admin notes (optional)"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] outline-none focus:border-accent"
                  />
                  <a
                    href={`mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("Nepal campaign verification")}`}
                    className="rounded-lg border border-border px-4 py-2 text-center text-[13px] font-semibold hover:border-accent"
                  >
                    Email user →
                  </a>
                  <button
                    type="button"
                    onClick={() => markReplied(r.id)}
                    className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
                  >
                    Mark replied
                  </button>
                </div>
              )}
              {r.adminNotes && (
                <p className="mt-2 text-[12px] text-muted">
                  Notes: {r.adminNotes}
                  {r.repliedAt && (
                    <>
                      {" "}
                      · replied <RelativeTime date={r.repliedAt} />
                    </>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
