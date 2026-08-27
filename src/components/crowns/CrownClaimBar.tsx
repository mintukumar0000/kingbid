"use client";

import { formatMoney } from "@/lib/format";
import type { CrownSpotState } from "@/lib/crown-spots-data";

function spotCode(spot: CrownSpotState): string {
  if (spot.tier === "crown") return "Crown Owner";
  if (spot.tier === "diamond") {
    const m = spot.label.match(/Diamond (\d+)/);
    return m ? `Gem ${m[1]}` : "Royal Gem";
  }
  if (spot.tier === "royal") {
    const m = spot.label.match(/#(\d+)/);
    return m ? `Panel ${m[1]}` : "Royal Panel";
  }
  const m = spot.label.match(/#(\d+)/);
  return m ? `Court ${m[1]}` : "Court Spot";
}

interface Props {
  spot: CrownSpotState;
  onBid: () => void;
  onClose: () => void;
}

export function CrownClaimBar({ spot, onBid, onClose }: Props) {
  const current = spot.currentBid > 0 ? spot.currentBid : spot.startingBid;

  return (
    <div className="crown-claim-bar" role="dialog" aria-label={`Claim ${spot.label}`}>
      <button type="button" className="crown-claim-bar-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <span className="crown-claim-bar-dot" aria-hidden />
      <span className="crown-claim-bar-name">{spotCode(spot)}</span>
      <span className="crown-claim-bar-price tabular">{formatMoney(current)}</span>
      <button type="button" className="crown-claim-bar-btn" onClick={onBid}>
        Claim {formatMoney(spot.nextBid)}
      </button>
    </div>
  );
}
