"use client";

import { useState } from "react";

interface Proposal {
  id: string;
  slug: string;
  name: string;
  description: string;
  user: { handle: string | null; name: string | null };
  createdAt: string;
}

export function AdminCategoryProposalsPanel({ password }: { password: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/category-proposals", {
      headers: { "x-admin-password": password },
    });
    const d = await res.json();
    if (res.ok) {
      setProposals(d.proposals);
      setLoaded(true);
    }
  }

  async function act(proposalId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/category-proposals", {
      method: "POST",
      headers: {
        "x-admin-password": password,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ proposalId, action }),
    });
    if (res.ok) {
      setProposals((p) => p.filter((x) => x.id !== proposalId));
      setMsg(action === "approve" ? "Category approved and room created." : "Proposal rejected.");
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Category proposals (Legendary)</h2>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium hover:border-accent"
        >
          {loaded ? "Refresh" : "Load proposals"}
        </button>
      </div>
      {msg && <p className="mt-2 text-[13px] text-muted">{msg}</p>}
      {!loaded ? (
        <p className="mt-4 text-[13px] text-muted">Legendary keepers propose new official categories here.</p>
      ) : proposals.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">0 pending proposals.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {proposals.map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-4 text-[13px]">
              <p className="font-semibold">
                {p.name} <span className="text-muted">({p.slug})</span>
              </p>
              <p className="text-muted">{p.description || "No description"}</p>
              <p className="mt-1 text-[12px] text-muted">
                by @{p.user.handle ?? p.user.name ?? "keeper"} · {new Date(p.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => act(p.id, "approve")}
                  className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => act(p.id, "reject")}
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
