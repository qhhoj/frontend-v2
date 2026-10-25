import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetServerClock, serverNow, syncServerClock } from './server-clock';

const answer = (headers: Record<string, string>) => new Headers(headers);
const SERVER_TIME = 'Sun, 25 Oct 2026 10:00:00 GMT';
const at = (offsetMs: number) => Date.parse(SERVER_TIME) + offsetMs;

describe('server clock', () => {
  afterEach(() => {
    resetServerClock();
    vi.useRealTimers();
  });

  it('follows the server when the device clock is wrong, and every later fresh answer replaces the offset', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(3_600_000));
    syncServerClock(answer({ Date: SERVER_TIME }), 'no-store', at(3_600_000));
    expect(serverNow()).toBe(at(500));
    vi.setSystemTime(at(10_000)); // the device clock was fixed
    syncServerClock(answer({ Date: 'Sun, 25 Oct 2026 10:00:10 GMT' }), 'no-store', at(10_000));
    expect(serverNow()).toBe(at(10_000));
  });

  it('keeps a correct device clock: the header is whole seconds, read at the midpoint of the round trip', () => {
    vi.useFakeTimers();
    // Written at 10:00:00.850 and sent as "10:00:00"; asked at .800, handled 600 ms later (round trip and a busy main thread).
    vi.setSystemTime(at(1_400));
    syncServerClock(answer({ Date: SERVER_TIME }), 'no-store', at(800));
    expect(serverNow()).toBe(Date.now());
  });

  it('ignores a CDN-cached answer, a browser-cacheable request and an unreadable date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(5000));
    syncServerClock(answer({ Date: SERVER_TIME, Age: '120' }), 'no-store', at(5000));
    syncServerClock(answer({ Date: SERVER_TIME }), undefined, at(5000));
    syncServerClock(answer({ Date: 'nonsense' }), 'no-store', at(5000));
    expect(serverNow()).toBe(at(5000));
  });
});
