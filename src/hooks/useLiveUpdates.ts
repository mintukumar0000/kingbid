"use client";

import { useEffect } from "react";
import { mutate } from "swr";
import type { LiveEvent } from "@/lib/events";

/**
 * Opens a Server-Sent Events stream so every open tab sees new bids
 * the instant a payment settles — not seconds later from polling.
 */
export function useLiveUpdates() {
  useEffect(() => {
    const es = new EventSource("/api/live");

    es.onmessage = (message) => {
      let event: LiveEvent;
      try {
        event = JSON.parse(message.data);
      } catch {
        return;
      }

      if (event.type === "bid") {
        mutate((key) => typeof key === "string" && key.startsWith("/api/listings"));
        mutate("/api/activity");
        mutate("/api/stats");
        mutate("/api/trending");
      } else if (event.type === "click") {
        mutate("/api/trending");
        mutate((key) => typeof key === "string" && key.startsWith("/api/listings"));
      } else if (event.type === "presence") {
        mutate("/api/stats");
      }
    };

    return () => es.close();
  }, []);
}
