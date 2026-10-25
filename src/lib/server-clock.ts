/**
 * The server's clock as the browser sees it: the offset between the `Date` header of an API answer and this device's clock.
 * Contest phases and countdowns read `serverNow()`, so a device with a wrong clock still switches phase when the server does.
 */
let offsetMs = 0;
let isSynced = false;

/** Server time now, epoch ms; the device clock until the first answer arrives. */
export const serverNow = (): number => Date.now() + offsetMs;

/**
 * Sets the offset once, from the first answer fetched with `cache: 'no-store'`: a browser-cache hit carries no `Age` but an old
 * `Date`, and a CDN copy has `Age` above zero. The `Date` header has one-second resolution, so the offset is good to about a second.
 */
export function syncServerClock(
  headers: Headers,
  cache: RequestCache | undefined,
  receivedAt = Date.now(),
): void {
  if (isSynced || cache !== 'no-store' || Number(headers.get('Age') ?? 0) > 0) return;
  const serverTime = Date.parse(headers.get('Date') ?? '');
  if (Number.isNaN(serverTime)) return;
  offsetMs = serverTime - receivedAt;
  isSynced = true;
}

/** For tests: back to the device clock. */
export function resetServerClock(): void {
  offsetMs = 0;
  isSynced = false;
}
