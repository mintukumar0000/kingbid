import { liveConnectionCount, onLive, registerConnection, unregisterConnection } from "@/lib/events";

export const dynamic = "force-dynamic";

// Server-Sent Events stream. Every connected browser receives bid and click
// events the instant they happen — true real-time, no polling delay.
export async function GET(request: Request) {
  const connectionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      registerConnection(connectionId);

      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const unsubscribe = onLive(send);

      // Presence updates + keep-alive every 15s
      const heartbeat = setInterval(() => {
        send({ type: "presence", online: liveConnectionCount() });
      }, 15_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        unregisterConnection(connectionId);
        try {
          controller.close();
        } catch {}
      };

      request.signal.addEventListener("abort", cleanup);

      // Initial hello with current presence
      send({ type: "presence", online: liveConnectionCount() });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
