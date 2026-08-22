/** Shared card shell for Trending + Latest activity widgets. */
export function SideCard({
  title,
  dot,
  children,
}: {
  title: React.ReactNode;
  dot?: "live";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow)]">
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-foreground">
        {dot === "live" && (
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}
