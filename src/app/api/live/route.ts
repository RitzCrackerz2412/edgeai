/**
 * GET /api/live — Server-Sent Events stream for live score updates.
 *
 * Client subscribes once and receives:
 *  - Initial snapshot of all live scores on connect
 *  - Incremental `score` events as scores change
 *  - `heartbeat` events every 15 s to keep the connection alive
 *
 * Usage (client):
 *   const es = new EventSource('/api/live');
 *   es.addEventListener('score', e => { const data = JSON.parse(e.data); ... });
 *   es.addEventListener('heartbeat', () => {});
 */

import { liveStore } from '@/lib/sync/store';
import { syncBus }   from '@/lib/sync/event-bus';
import type { LiveScore } from '@/lib/sync/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  function send(event: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      // ── Initial snapshot ───────────────────────────────────────────────────
      // Send all cached live scores immediately on connect
      try {
        const meta = await liveStore.getSyncMeta('live');
        controller.enqueue(send('snapshot', { syncedAt: meta?.lastSyncAt ?? null }));
      } catch { /* continue */ }

      // ── Live score listener ────────────────────────────────────────────────
      const unsub = syncBus.on('live:score', ({ score }) => {
        try {
          controller.enqueue(send('score', score));
        } catch { /* client disconnected */ }
      });

      // ── Final score listener ───────────────────────────────────────────────
      const unsubFinal = syncBus.on('game:final', ({ score }) => {
        try {
          controller.enqueue(send('final', score));
        } catch { /* client disconnected */ }
      });

      // ── Heartbeat (keep-alive every 15s) ───────────────────────────────────
      const heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeatId);
        }
      }, 15_000);

      // ── Cleanup on cancel ──────────────────────────────────────────────────
      return () => {
        unsub();
        unsubFinal();
        clearInterval(heartbeatId);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
    },
  });
}
