"use client";

import { useEffect, useState } from "react";

type Promo = { slug: string; name: string; claimUrl: string | null };
type Personal = {
  id: string;
  invitedContact: string;
  category: string;
  status: string;
  claimUrl: string;
  createdAt: string;
};

export function AdminInvitesPanel({ password }: { password: string }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [email, setEmail] = useState("");
  const [categorySlug, setCategorySlug] = useState("ai-agents");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = { "x-admin-password": password, "Content-Type": "application/json" };

  async function load() {
    const res = await fetch("/api/admin/invites", { headers: { "x-admin-password": password } });
    if (!res.ok) return;
    const d = await res.json();
    setPromos(d.promos ?? []);
    setPersonal(d.personal ?? []);
  }

  useEffect(() => {
    load();
  }, [password]);

  async function createPersonal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGenerated(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers,
      body: JSON.stringify({ invitedContact: email, categorySlug, type: "personal" }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) {
      setGenerated(d.claimUrl);
      setEmail("");
      load();
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const aiPromo = promos.find((p) => p.slug === "ai-agents");

  return (
    <div className="mt-12 space-y-10">
      <section>
        <h2 className="text-lg font-bold">Twitter promo links (reusable)</h2>
        <p className="mt-1 text-[13px] text-muted">
          One link per room — anyone can list. Share these on X. Never expires.
        </p>
        {aiPromo?.claimUrl && (
          <div className="mt-4 rounded-xl border border-[#f0cfc3] bg-peach p-4">
            <p className="text-[12px] font-semibold text-accent">AI agents — paste on Twitter</p>
            <code className="mt-2 block break-all text-[12px] text-foreground">{aiPromo.claimUrl}</code>
            <button
              type="button"
              onClick={() => copy(aiPromo.claimUrl!, "ai-promo")}
              className="mt-2 text-[12px] font-semibold text-accent hover:underline"
            >
              {copied === "ai-promo" ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}
        <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-surface-2 text-left text-muted">
              <tr>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2">Promo link</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.slug} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-muted">{p.claimUrl ?? "—"}</td>
                  <td className="px-3 py-2">
                    {p.claimUrl && (
                      <button
                        type="button"
                        onClick={() => copy(p.claimUrl!, p.slug)}
                        className="font-semibold text-accent hover:underline"
                      >
                        {copied === p.slug ? "Copied" : "Copy"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Personal invite (one founder)</h2>
        <p className="mt-1 text-[13px] text-muted">DM this link to one person — single use.</p>
        <form onSubmit={createPersonal} className="mt-4 flex flex-wrap gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@email.com"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            required
          />
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            {promos.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            Generate
          </button>
        </form>
        {generated && (
          <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
            <p className="text-[11px] text-muted">Send this link:</p>
            <code className="mt-1 block break-all text-[12px]">{generated}</code>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">Recent personal invites</h2>
        <ul className="mt-3 space-y-2 text-[12px]">
          {personal.slice(0, 10).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
              <span className="font-medium">{i.invitedContact}</span>
              <span className="text-muted">{i.category}</span>
              <span className={i.status === "claimed" ? "text-muted" : "text-accent"}>{i.status}</span>
              <button
                type="button"
                onClick={() => copy(i.claimUrl, i.id)}
                className="ml-auto font-semibold text-accent hover:underline"
              >
                {copied === i.id ? "Copied" : "Copy"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
