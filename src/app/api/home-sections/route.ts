import { NextResponse } from "next/server";
import { getBreakoutListings } from "@/lib/momentum";
import { getGlobalBoardId, getCurrentKing, getNextChallenger } from "@/lib/reign";
import { getUnderdogRow } from "@/lib/underdog";
import { getRecentPlatformEvents } from "@/lib/platform-events";
import { formatMoney } from "@/lib/format";
import { priceForTopSpot } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Homepage sections: Global King · Breakout · Underdogs · Momentum */
export async function GET() {
  const globalBoardId = await getGlobalBoardId();
  const [king, challenger, breakout, underdogs, events] = await Promise.all([
    getCurrentKing(globalBoardId),
    getCurrentKing(globalBoardId).then((k) => getNextChallenger(globalBoardId, k?.id ?? null)),
    getBreakoutListings(5),
    getUnderdogRow(null, 5),
    getRecentPlatformEvents(8),
  ]);

  const gap =
    king && challenger ? Math.max(0, priceForTopSpot(king.currentBid) - challenger.currentBid) : null;

  return NextResponse.json({
    globalKing: king
      ? {
          ...king,
          gapToDethrone: gap,
          gapLabel: gap != null ? `${formatMoney(gap)} to dethrone` : null,
        }
      : null,
    challenger,
    breakout,
    underdogs,
    momentum: breakout,
    events,
  });
}
