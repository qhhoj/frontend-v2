import { API_BASE } from './client';

export type EventHandlers = Record<string, (data: unknown) => void>;
export interface EventStream {
  close(): void;
}

/**
 * One EventSource on `/api/internal<path>`; each named event goes to its handler as parsed JSON.
 * While the connection drops the browser reconnects by itself, waiting the server's `retry: 3000`.
 * `onClosed` fires when it gives up for good (server refused with 403/404/429 or closed the stream), so callers stop waiting.
 */
export function openEventStream(
  path: string,
  handlers: EventHandlers,
  onClosed?: () => void,
): EventStream {
  const source = new EventSource(`${API_BASE}${path}`);
  for (const [type, handle] of Object.entries(handlers))
    source.addEventListener(type, (event) => {
      let data: unknown;
      try {
        data = JSON.parse((event as MessageEvent<string>).data);
      } catch {
        return;
      }
      if (typeof data === 'object' && data !== null) handle(data);
    });
  source.addEventListener('error', () => {
    if (source.readyState === EventSource.CLOSED) onClosed?.();
  });
  return { close: () => source.close() };
}
