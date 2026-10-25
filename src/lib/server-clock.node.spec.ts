import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetServerClock, serverNow, syncServerClock } from './server-clock';

const answer = (headers: Record<string, string>) => new Headers(headers);
const SERVER_TIME = 'Sun, 25 Oct 2026 10:00:00 GMT';

describe('server clock', () => {
  afterEach(() => {
    resetServerClock();
    vi.useRealTimers();
  });

  it('follows the server when the device clock is wrong, and keeps the first fresh answer', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(SERVER_TIME) + 3_600_000);
    syncServerClock(answer({ Date: SERVER_TIME }), 'no-store');
    expect(serverNow()).toBe(Date.parse(SERVER_TIME));
    syncServerClock(answer({ Date: 'Sun, 25 Oct 2026 12:00:00 GMT' }), 'no-store');
    expect(serverNow()).toBe(Date.parse(SERVER_TIME));
  });

  it('ignores a CDN-cached answer, a browser-cacheable request and an unreadable date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(SERVER_TIME) + 5000);
    syncServerClock(answer({ Date: SERVER_TIME, Age: '120' }), 'no-store');
    syncServerClock(answer({ Date: SERVER_TIME }), undefined);
    syncServerClock(answer({ Date: 'nonsense' }), 'no-store');
    expect(serverNow()).toBe(Date.parse(SERVER_TIME) + 5000);
  });
});
