"use client";

import { useState } from "react";

interface PendingRoom {
  id: string;
  slug: string;
  name: string;
  description: string;
  roomType: string;
  requesterEmail: string | null;
  createdAt: string;
}

export function AdminRoomsPanel({ password }: { password: string }) {
  const [pending, setPending] = useState<PendingRoom[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/rooms", {
      headers: { "x-admin-password": password },
    });
    const d = await res.json();
    if (res.ok) {
      setPending(d.pending);
      setLoaded(true);
    }
  }

  async function act(roomId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: {
        "x-admin-password": password,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId, action }),
    });
    if (res.ok) {
      setPending((p) => p.filter((r) => r.id !== roomId));
      setMsg(action === "approve" ? "Room approved." : "Request rejected.");
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Pending room requests</h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium hover:border-accent"
        >
          {loaded ? "Refresh" : "Load requests"}
        </button>
      </div>
      {msg && <p className="mt-2 text-[13px] text-muted">{msg}</p>}
      {!loaded ? (
        <p className="mt-4 text-[13px] text-muted">Click load to review community room requests.</p>
      ) : pending.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">0 pending requests.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((r) => (
            <li key={r.id} className="rounded-xl border border-border p-4 text-[13px]">
              <p className="font-semibold">
                {r.name} <span className="text-muted">({r.slug})</span>
              </p>
              <p className="text-muted">{r.description || "No description"}</p>
              <p className="mt-1 text-[12px] text-muted">
                {r.roomType} · {r.requesterEmail ?? "unknown"} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => act(r.id, "approve")}
                  className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => act(r.id, "reject")}
                  className="rounded-full border border-border px-3 py-1 text-[12px]"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
