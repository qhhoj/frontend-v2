/** A good reading is taken again this often, so a device clock fixed meanwhile is followed. */
export const CLOCK_REFRESH_MS = 10 * 60_000;
/** Waits after the 1st, 2nd, 3rd and later failed readings; until one succeeds the offset stays 0 (the device clock). */
export const CLOCK_RETRY_MS = [5_000, 30_000, 120_000] as const;
/** A tab shown again (or back online) reads again when its last good reading is older than this. */
const STALE_MS = 60_000;

/**
 * Keeps the server-clock offset fresh: `read` (a `no-store` request, whose answer `syncServerClock` reads) runs at once, again
 * every `CLOCK_REFRESH_MS`, after a failure with backoff, and when the tab is shown again or comes back online with a stale
 * reading. Returns a stop function. Call once, at boot.
 */
export function keepServerClockSynced(read: () => Promise<unknown>): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  let lastReadAt = Number.NEGATIVE_INFINITY;
  let isReading = false;
  const schedule = (delayMs: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), delayMs);
  };
  async function run() {
    if (isReading) return;
    isReading = true;
    try {
      await read();
      failures = 0;
      lastReadAt = Date.now();
      schedule(CLOCK_REFRESH_MS);
    } catch {
      schedule(CLOCK_RETRY_MS[Math.min(failures++, CLOCK_RETRY_MS.length - 1)]!);
    } finally {
      isReading = false;
    }
  }
  // Date.now(), not a monotonic clock: a device clock that jumped since the last reading is exactly what needs a new one.
  const readIfStale = () => {
    if (document.visibilityState === 'visible' && Math.abs(Date.now() - lastReadAt) > STALE_MS)
      void run();
  };
  document.addEventListener('visibilitychange', readIfStale);
  window.addEventListener('online', readIfStale);
  void run();
  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', readIfStale);
    window.removeEventListener('online', readIfStale);
  };
}
