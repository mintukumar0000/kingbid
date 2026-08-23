"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";

export default function RequestRoomPage() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("founder_type");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ slug: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const field =
    "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        name,
        description,
        roomType,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Request failed.");
    setSuccess({ slug: data.slug, status: data.status });
  }

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} mx-auto max-w-lg px-4 py-10 sm:px-6`}>
        <Link href="/founders" className="text-[13px] text-accent hover:underline">
          ← Founder Hub
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Request a room</h1>
        <p className="mt-2 text-[14px] text-muted">
          New rooms need Kingbid Score ≥ 30 for instant approval, otherwise they go to admin review. This
          prevents spam like &quot;Best Startup Ever&quot; boards.
        </p>

        {success ? (
          <div className="mt-8 rounded-2xl border border-green/30 bg-green/5 p-6">
            <p className="font-semibold">
              {success.status === "active" ? "Room created!" : "Request submitted for review"}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Slug: <code>{success.slug}</code>
              {success.status === "pending" && " — Mintu will approve in /admin."}
              {success.status === "active" && (
                <>
                  {" "}
                  — <Link href={`/?room=${success.slug}`} className="text-accent hover:underline">Enter room</Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">URL slug (lowercase)</label>
              <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="india-saas" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Room name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="India SaaS" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Description</label>
              <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Room type</label>
              <select className={field} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                <option value="founder_type">Founder type</option>
                <option value="geo">Geo / region</option>
                <option value="tech">Tech stack</option>
                <option value="category">Category</option>
              </select>
            </div>
            {error && <p className="text-sm text-red">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit room request"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
