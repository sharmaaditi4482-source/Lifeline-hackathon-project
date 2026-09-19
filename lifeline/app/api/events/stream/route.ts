import { getRecentLiveEvents, onLiveEvent } from "@/lib/services/eventService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(obj: object): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

const encoder = new TextEncoder();

/**
 * GET /api/events/stream
 * Server-Sent-Events live feed of the matching/dispatch event bus.
 * On connect: replays the recent ring buffer, then streams every new event as
 * it is recorded (request created → match found → confirmed → donation). A
 * heartbeat keeps the connection alive through proxies.
 */
export async function GET() {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let disconnected = false;

      const send = (obj: object) => {
        if (disconnected) return;
        try {
          controller.enqueue(encoder.encode(sse(obj)));
        } catch {
          disconnected = true;
        }
      };

      // Replay recent history so the panel is never empty on connect.
      for (const ev of getRecentLiveEvents(15)) {
        send({ type: "event", event: ev });
      }

      const unsubscribe = onLiveEvent((event) => {
        send({ type: "event", event });
      });

      // Heartbeat comment every 20s keeps load-balancers / browsers honest.
      const heartbeat = setInterval(() => {
        if (!disconnected) {
          try {
            controller.enqueue(encoder.encode(`: ping ${new Date().toISOString()}\n\n`));
          } catch {
            disconnected = true;
          }
        }
        if (disconnected) {
          unsubscribe();
          clearInterval(heartbeat);
        }
      }, 20000);

      // If the client disappears mid-connection the next enqueue fails and we
      // tear down via the heartbeat above.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}