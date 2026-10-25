/**
 * The server's clock as the browser sees it: the offset between the `Date` header of an API answer and this device's clock.
 * Contest phases and countdowns read `serverNow()`, so a device with a wrong clock still switches phase when the server does.
 * Until the first reading arrives (or while every reading fails) the offset is 0: the device clock.
 */
let offsetMs = 0;

/** Half a second: the `Date` header is truncated to whole seconds, so the server's real time is on average this much later. */
const HALF_SECOND_MS = 500;
/**
 * A reading is good to about half a second plus half the round trip: a smaller offset is measurement error, not a wrong device
 * clock, and is left at 0 so a correct device keeps its own clock.
 */
const NOISE_MS = 1000;

/** Server time now, epoch ms; the device clock until the first reading arrives. */
export const serverNow = (): number => Date.now() + offsetMs;

/**
 * The device clock's error, from one answer: the server wrote `Date` (whole seconds) between `sentAt` and `receivedAt`, so its
 * time is taken at the midpoint of the round trip, half a second past the truncated header. 0 within the measurement error.
 */
export function clockOffsetOf(serverDate: number, sentAt: number, receivedAt: number): number {
  const offset = serverDate + HALF_SECOND_MS - (sentAt + receivedAt) / 2;
  return Math.abs(offset) < NOISE_MS ? 0 : Math.round(offset);
}

/**
 * Takes the offset from an answer fetched with `cache: 'no-store'` (a browser-cache hit carries no `Age` but an old `Date`, and
 * a CDN copy has `Age` above zero). Every reading replaces the last one, so a device clock fixed meanwhile is followed.
 */
export function syncServerClock(
  headers: Headers,
  cache: RequestCache | undefined,
  sentAt: number,
  receivedAt = Date.now(),
): boolean {
  if (cache !== 'no-store' || Number(headers.get('Age') ?? 0) > 0) return false;
  const serverDate = Date.parse(headers.get('Date') ?? '');
  if (Number.isNaN(serverDate)) return false;
  offsetMs = clockOffsetOf(serverDate, sentAt, receivedAt);
  return true;
}

/** For tests: back to the device clock. */
export function resetServerClock(): void {
  offsetMs = 0;
}
