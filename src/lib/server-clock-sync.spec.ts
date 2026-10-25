import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLOCK_REFRESH_MS, CLOCK_RETRY_MS, keepServerClockSynced } from './server-clock-sync';

describe('keepServerClockSynced', () => {
  let stop = () => {};
  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it('retries a failed boot reading with backoff, then reads again on a timer', async () => {
    vi.useFakeTimers();
    const outcomes = [false, false, true, true];
    const read = vi.fn(() =>
      outcomes.shift() ? Promise.resolve() : Promise.reject(new Error('offline')),
    );
    stop = keepServerClockSynced(read);
    await vi.advanceTimersByTimeAsync(0);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(CLOCK_RETRY_MS[0]);
    expect(read).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(CLOCK_RETRY_MS[1]);
    expect(read).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(CLOCK_REFRESH_MS);
    expect(read).toHaveBeenCalledTimes(4);
  });
});
