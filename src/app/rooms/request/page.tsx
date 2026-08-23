"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";
import { fetcher } from "@/lib/fetcher";

export default function RequestRoomPage() {
  const { data: roomsData } = useSWR<{ rooms: { id: string; slug: string; name: string; roomType: string }[] }>(
    "/api/rooms",
    fetcher
  );
  const geoParents = (roomsData?.rooms ?? []).filter((r) => r.roomType === "geo");

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("founder_type");
  const [parentRoomId, setParentRoomId] = useState("");
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
        ...(parentRoomId ? { parentRoomId } : {}),
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
      <div className={`${PAGE} mx-auto max-w-lg py-10`}>
        <Link href="/founders" className="text-[13px] text-accent hover:underline">
          ← Founder Hub
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Request a room</h1>
        <p className="mt-2 text-[14px] text-muted">
          Score ≥ 30 for instant approval. Geo sub-rooms nest under a parent (e.g. india → saas).
        </p>

        {success ? (
          <div className="mt-8 rounded-2xl border border-green/30 bg-green/5 p-6">
            <p className="font-semibold">
              {success.status === "active" ? "Room created!" : "Request submitted for review"}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Slug: <code>{success.slug}</code>
              {success.status === "active" && (
                <>
                  {" "}
                  —{" "}
                  <Link href={`/rooms/${success.slug}`} className="text-accent hover:underline">
                    Open room
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">URL slug (lowercase)</label>
              <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="saas" required />
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
                <option value="geo">Geo / region (parent hub)</option>
                <option value="tech">Tech stack (sub-room)</option>
                <option value="category">Category</option>
              </select>
            </div>
            {(roomType === "tech" || roomType === "category") && geoParents.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Parent geo room (optional)</label>
                <select className={field} value={parentRoomId} onChange={(e) => setParentRoomId(e.target.value)}>
                  <option value="">No parent</option>
                  {geoParents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
