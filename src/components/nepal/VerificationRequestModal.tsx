"use client";

import { useState } from "react";
import { NEPAL_CAMPAIGN } from "@/lib/nepal-campaign-config";

export function VerificationRequestModal({
  open,
  onClose,
  defaultPaymentPublicId,
  defaultListingUrl,
}: {
  open: boolean;
  onClose: () => void;
  defaultPaymentPublicId?: string;
  defaultListingUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [paymentPublicId, setPaymentPublicId] = useState(defaultPaymentPublicId ?? "");
  const [listingUrl, setListingUrl] = useState(defaultListingUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Email is required.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/nepal-relief/verification-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          message: message.trim() || undefined,
          paymentPublicId: paymentPublicId.trim() || undefined,
          listingUrl: listingUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setDone(false);
      setError(null);
      setSubmitting(false);
    }, 200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="modal-in flex max-h-[min(90dvh,560px)] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[var(--shadow)] sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">🇳🇵 Verification</p>
              <h2 className="mt-1 text-lg font-bold">Request campaign proof</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="-mt-1 text-xl leading-none text-muted hover:text-foreground"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted">
            100% of eligible proceeds go to {NEPAL_CAMPAIGN.recipient} after Dodo settlement. Submit this form and
            we&apos;ll email you receipts or transfer details.
          </p>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[15px] font-semibold text-foreground">Request received</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              We&apos;ll reply to <strong className="text-foreground">{email}</strong> with verification details as
              soon as we can.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-white hover:brightness-110"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Your email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name (optional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Payment / transaction ID (optional)
                </label>
                <input
                  value={paymentPublicId}
                  onChange={(e) => setPaymentPublicId(e.target.value)}
                  placeholder="e.g. NP-2026-001"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Listing URL (optional)</label>
                <input
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  placeholder="yoursite.com"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">What do you need verified?</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Receipt, settlement proof, donation transfer, etc."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
              )}
            </div>
            <div className="shrink-0 border-t border-border px-5 py-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-accent px-4 py-2.5 text-[15px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function VerificationRequestTrigger({
  className,
  label = "Request verification →",
  defaultPaymentPublicId,
  defaultListingUrl,
}: {
  className?: string;
  label?: string;
  defaultPaymentPublicId?: string;
  defaultListingUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <VerificationRequestModal
        open={open}
        onClose={() => setOpen(false)}
        defaultPaymentPublicId={defaultPaymentPublicId}
        defaultListingUrl={defaultListingUrl}
      />
    </>
  );
}
