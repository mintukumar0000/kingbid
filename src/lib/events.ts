// In-process live event bus. Powers the Server-Sent Events stream so every
// connected visitor sees new bids the moment a payment settles — no polling
// delay. Survives Next.js dev hot-reloads via globalThis.

import { EventEmitter } from "events";

export interface LiveBidEvent {
  type: "bid";
  listingId: string;
  displayUrl: string;
  title: string;
  amount: number;
  totalAfter: number;
  isTakeover: boolean;
  at: string;
}

export interface LiveClickEvent {
  type: "click";
  listingId: string;
  clickCount: number;
}

export type LiveEvent =
  | LiveBidEvent
  | LiveClickEvent
  | { type: "presence"; online: number };

const g = globalThis as unknown as {
  __liveEmitter?: EventEmitter;
  __liveConnections?: Set<string>;
};

const emitter = (g.__liveEmitter ??= (() => {
  const e = new EventEmitter();
  e.setMaxListeners(0);
  return e;
})());

// Active SSE connections — the most honest "online right now" signal we have.
const connections = (g.__liveConnections ??= new Set<string>());

export function emitLive(event: LiveEvent): void {
  emitter.emit("live", event);
}

export function onLive(listener: (event: LiveEvent) => void): () => void {
  emitter.on("live", listener);
  return () => emitter.off("live", listener);
}

export function registerConnection(id: string): void {
  connections.add(id);
}

export function unregisterConnection(id: string): void {
  connections.delete(id);
}

export function liveConnectionCount(): number {
  return connections.size;
}
