"use client";

export function EventShareButton({
  headline,
  eventType,
  room,
}: {
  headline: string;
  eventType: string;
  room?: string;
}) {
  const og = `/api/og?event=${encodeURIComponent(eventType)}&headline=${encodeURIComponent(headline)}${room ? `&room=${encodeURIComponent(room)}` : ""}`;
  const text = encodeURIComponent(`${headline} — kingbid.lol`);
  const url = encodeURIComponent("https://kingbid.lol");

  return (
    <a
      href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-medium hover:border-accent"
    >
      Share on X
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={og} alt="" className="hidden" />
    </a>
  );
}
