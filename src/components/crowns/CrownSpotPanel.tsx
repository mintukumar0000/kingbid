"use client";

import { formatMoney, faviconFor } from "@/lib/format";
import type { CrownSpotState } from "@/lib/crown-spots-data";

interface Props {
  spot: CrownSpotState;
  onBid: () => void;
  onClose: () => void;
}

export function CrownSpotPanel({ spot, onBid, onClose }: Props) {
  const cta = spot.hasOwner ? "Steal this spot" : "Claim your spot";

  return (
    <div className="crown-spot-panel" role="dialog" aria-label={`${spot.label} bid panel`}>
      <button type="button" className="crown-spot-panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <p className="crown-spot-panel-eyebrow">{spot.tierLabel}</p>
      <h3 className="crown-spot-panel-title">
        {spot.shortLabel} {spot.label}
      </h3>
      {spot.hasOwner && spot.ownerUrl && (
        <div className="crown-spot-panel-owner">
          <img src={faviconFor(spot.ownerUrl)} alt="" width={28} height={28} className="rounded-md" />
          <span>@{spot.ownerHandle ?? spot.ownerTitle}</span>
        </div>
      )}
      <p className="crown-spot-panel-price tabular">{formatMoney(spot.currentBid > 0 ? spot.currentBid : spot.nextBid)}</p>
      <p className="crown-spot-panel-copy">Put your logo on the crown.</p>
      <p className="crown-spot-panel-meta">
        {spot.bidCount > 0 ? `${spot.bidCount} bids` : "Open spot"}
        {spot.watchers > 0 ? ` · ${spot.watchers} watching` : ""}
      </p>
      <button type="button" className="crown-spot-panel-cta" onClick={onBid}>
        {cta} → ${spot.nextBid.toLocaleString()}
      </button>
    </div>
  );

}
