import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PAGE } from "@/lib/layout";
import { formatMoney } from "@/lib/format";
import { getBoardHistory, getGlobalBoardId } from "@/lib/reign";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ boardId: string }> };

export default async function BoardHistoryPage({ params }: Props) {
  const { boardId } = await params;
  const resolvedId = boardId === "global" ? await getGlobalBoardId() : boardId;

  const board = await prisma.board.findUnique({
    where: { id: resolvedId },
    include: { category: { select: { name: true, slug: true } } },
  });
  if (!board) notFound();

  const history = await getBoardHistory(resolvedId);
  const title =
    boardId === "global"
      ? "Global board — #1 history"
      : board.category
        ? `${board.category.name} — #1 history`
        : "Board history";

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-12`}>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Permanent record of every #1 reign. Only real paid listings appear on the live board.
        </p>

        {history.length === 0 ? (
          <p className="mt-10 text-muted">No #1 reigns recorded yet — be the first.</p>
        ) : (
          <ol className="mt-8 space-y-4">
            {history.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/l/${row.listing.slug}`} className="font-semibold text-accent hover:underline">
                    {row.listing.displayUrl}
                  </Link>
                  <span className="tabular text-sm text-muted">{formatMoney(row.listing.currentBid)}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {row.startedAt.toLocaleString()}
                  {row.endedAt ? ` → ${row.endedAt.toLocaleString()}` : " → now"}
                </p>
              </li>
            ))}
          </ol>
        )}

        <Link href="/" className="mt-10 inline-block text-sm text-accent hover:underline">
          ← Back to leaderboard
        </Link>
      </div>
    </main>
  );
}
